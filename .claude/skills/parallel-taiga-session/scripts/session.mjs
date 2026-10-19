#!/usr/bin/env node
// Coordinates any number of parallel agent sessions on one machine.
//
// Every session gets a numbered slot with its own git worktree
// (<repo>/.claude/worktrees/moach-s<N>), its own ports and at most one story.
// The registry lives in the shared git directory (<git-common-dir>/moach-sessions),
// so all worktrees see the same state and nothing is committed. Locks are
// directories, because mkdir is atomic on every platform.
//
// Usage: node session.mjs <command> [args]
//   claim [--slot N] [--story NR] [--takeover]   take a slot, create or refresh its worktree
//   take-story <N> <NR> [--epic E] [--takeover]  lock a story for slot N
//   update <N> [--branch B] [--epic E] [--phase P]  record progress (also a heartbeat)
//   busy-files <N>                               files changed in the other active slots
//   merge-lock <N> [--wait MINUTES]              wait for the merge lock (default 9 minutes)
//   merge-unlock <N>
//   release-story <N>
//   release <N>                                  free the slot, keep the worktree for reuse
//                                                (a free slot has no registry directory)
//   remove <N>                                   free the slot and delete its clean worktree
//   status [--json]
//
// Exit codes: 0 ok, 1 error, 2 usage, 3 taken by a live session, 4 taken by a stale session
// (repeat with --takeover after asking the person), 5 timeout waiting for the merge lock.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const STALE_MINUTES = 120;
const MERGE_STALE_MINUTES = 60;
const PORT_BASE = 4200;
const HOT_FILES = ["frontend/src/legacy/app.js", "frontend/src/app.css"];

const [command, ...rest] = process.argv.slice(2);
const flags = {};
const args = [];
for (let i = 0; i < rest.length; i++) {
  if (rest[i].startsWith("--")) {
    const key = rest[i].slice(2);
    const next = rest[i + 1];
    if (next === undefined || next.startsWith("--")) flags[key] = true;
    else flags[key] = rest[++i];
  } else args.push(rest[i]);
}

const fail = (message, code = 1) => {
  console.error(`FEHLER: ${message}`);
  process.exit(code);
};

function git(cwd, ...gitArgs) {
  const r = spawnSync("git", gitArgs, { cwd, encoding: "utf8" });
  return {
    ok: r.status === 0,
    out: (r.stdout || "").trim(),
    err: (r.stderr || "").trim(),
  };
}

const commonDir = (() => {
  const r = git(
    process.cwd(),
    "rev-parse",
    "--path-format=absolute",
    "--git-common-dir",
  );
  if (!r.ok) fail("kein Git-Repository");
  return r.out;
})();
const mainRepo = path.dirname(commonDir);
const registry = path.join(commonDir, "moach-sessions");
const slotsDir = path.join(registry, "slots");
const storiesDir = path.join(registry, "stories");
const mergeLock = path.join(registry, "merge.lock");
fs.mkdirSync(slotsDir, { recursive: true });
fs.mkdirSync(storiesDir, { recursive: true });

const now = () => new Date().toISOString();
const ageMinutes = (iso) =>
  iso ? (Date.now() - Date.parse(iso)) / 60000 : Infinity;
const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
};
const writeJson = (file, data) =>
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
const tryMkdir = (dir) => {
  try {
    fs.mkdirSync(dir);
    return true;
  } catch (e) {
    if (e.code === "EEXIST") return false;
    throw e;
  }
};

const worktreeOf = (n) =>
  path.join(mainRepo, ".claude", "worktrees", `moach-s${n}`);
const slotFile = (n) => path.join(slotsDir, String(n), "slot.json");
const portsOf = (n) => {
  const base = PORT_BASE + 10 * n;
  return {
    e2e: base,
    qaAfter: base + 1,
    qaBefore: base + 2,
    previewFrom: base + 3,
    previewTo: base + 9,
  };
};
const slotNumber = (value) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || PORT_BASE + 10 * n + 9 > 65535)
    fail(`ungültiger Platz: ${value}`, 2);
  return n;
};
const storyNumber = (value) => {
  const nr = String(value ?? "").replace(/^#/, "");
  if (!/^\d+$/.test(nr)) fail(`ungültige Story-Nummer: ${value}`, 2);
  return nr;
};

function readSlot(n) {
  return readJson(slotFile(n));
}
function saveSlot(n, changes) {
  const data = { ...(readSlot(n) || { slot: n }), ...changes, updated: now() };
  writeJson(slotFile(n), data);
  // The worktree copy is what tools inside the worktree read (Playwright, QA, preview).
  if (fs.existsSync(data.worktree || ""))
    writeJson(path.join(data.worktree, ".moach-session.json"), data);
  return data;
}
function activeSlots() {
  return fs
    .readdirSync(slotsDir)
    .filter((name) => /^\d+$/.test(name))
    .map(Number)
    .sort((a, b) => a - b)
    .map((n) => readSlot(n) || { slot: n });
}
const isStale = (slot) => ageMinutes(slot.updated) > STALE_MINUTES;
const storyOwner = (nr) => readJson(path.join(storiesDir, nr, "owner.json"));

function requireSlot(n) {
  const slot = readSlot(n);
  if (!slot) fail(`Platz ${n} ist nicht belegt. Zuerst: claim`);
  return slot;
}

function lockStory(n, nr, epic, takeover) {
  const dir = path.join(storiesDir, nr);
  if (!tryMkdir(dir)) {
    const owner = storyOwner(nr);
    if (owner && owner.slot !== n) {
      const other = readSlot(owner.slot);
      if (other && !isStale(other) && !takeover)
        fail(
          `Story ${nr} läuft in Platz ${owner.slot} (aktiv vor ${Math.round(ageMinutes(other.updated))} min)`,
          3,
        );
      if (other && !takeover)
        fail(
          `Story ${nr} gehört Platz ${owner.slot}, seit ${Math.round(ageMinutes(other.updated))} min ohne Lebenszeichen. Übernehmen nur nach Rückfrage mit --takeover`,
          4,
        );
      if (other)
        saveSlot(owner.slot, {
          story: null,
          epic: null,
          phase: `Story ${nr} an Platz ${n} abgegeben`,
        });
    }
  }
  writeJson(path.join(dir, "owner.json"), { slot: n, since: now() });
  const slot = readSlot(n);
  if (slot.story === nr) return saveSlot(n, epic ? { epic } : {});
  if (slot.story) unlockStory(n, slot.story);
  return saveSlot(n, {
    story: nr,
    epic: epic ?? null,
    branch: null,
    phase: "Story gewählt",
  });
}
function unlockStory(n, nr) {
  const owner = storyOwner(nr);
  if (!owner || owner.slot === n)
    fs.rmSync(path.join(storiesDir, nr), { recursive: true, force: true });
}

function lockHash(worktree) {
  const file = path.join(worktree, "frontend", "package-lock.json");
  return fs.existsSync(file)
    ? createHash("sha256").update(fs.readFileSync(file)).digest("hex")
    : null;
}

// Creates the worktree on first use, otherwise keeps it as it is. Dependencies are installed
// per worktree (never linked), so `npm ci` in one session cannot wipe another one's node_modules.
function prepareWorktree(n) {
  const worktree = worktreeOf(n);
  const notes = [];
  git(mainRepo, "fetch", "origin", "--quiet");
  if (!fs.existsSync(worktree)) {
    git(mainRepo, "worktree", "prune");
    fs.mkdirSync(path.dirname(worktree), { recursive: true });
    const add = git(
      mainRepo,
      "worktree",
      "add",
      "--detach",
      worktree,
      "origin/main",
    );
    if (!add.ok) fail(`Worktree nicht angelegt\n${add.err}`);
    notes.push("Worktree neu angelegt (origin/main)");
  } else {
    const dirty = git(worktree, "status", "--porcelain").out;
    if (dirty)
      notes.push("Worktree hat uncommittete Änderungen, nichts verändert");
  }
  const frontend = path.join(worktree, "frontend");
  const previous = readJson(path.join(worktree, ".moach-session.json"));
  const hash = lockHash(worktree);
  if (
    !fs.existsSync(path.join(frontend, "node_modules")) ||
    previous?.lockHash !== hash
  ) {
    const ci = spawnSync("npm", ["ci", "--silent"], {
      cwd: frontend,
      shell: process.platform === "win32",
      encoding: "utf8",
    });
    if (ci.status !== 0)
      fail(`npm ci fehlgeschlagen\n${(ci.stderr || "").slice(-2000)}`);
    notes.push("Abhängigkeiten installiert");
  }
  // Public build values only; the file is linked, never read.
  const envSource = path.join(mainRepo, "frontend", ".env.local");
  const envTarget = path.join(frontend, ".env.local");
  if (fs.existsSync(envSource) && !fs.existsSync(envTarget)) {
    try {
      fs.symlinkSync(envSource, envTarget);
    } catch {
      fs.copyFileSync(envSource, envTarget);
    }
  } else if (!fs.existsSync(envSource))
    notes.push(
      "frontend/.env.local fehlt im Haupt-Checkout (nur für npm run build/dev nötig)",
    );
  return { worktree, hash, notes };
}

function claim() {
  const takeover = Boolean(flags.takeover);
  let n = null;
  // A session started inside a slot worktree keeps that slot.
  const top = git(process.cwd(), "rev-parse", "--show-toplevel").out;
  const match = /moach-s(\d+)$/.exec(top);
  if (flags.slot) n = slotNumber(flags.slot);
  else if (
    match &&
    path.resolve(top) === path.resolve(worktreeOf(Number(match[1])))
  )
    n = Number(match[1]);
  else if (flags.story) {
    // Resuming a story means continuing in the slot that has its branch.
    const owner = storyOwner(storyNumber(flags.story));
    if (owner) n = owner.slot;
  }

  if (n !== null) {
    if (!tryMkdir(path.join(slotsDir, String(n))) && !match) {
      const existing = readSlot(n);
      const age = Math.round(ageMinutes(existing?.updated));
      if (existing && !isStale(existing) && !takeover)
        fail(
          `Platz ${n} ist aktiv (vor ${age} min, Story ${existing.story ?? "–"})`,
          3,
        );
      if (existing && !takeover)
        fail(
          `Platz ${n} ist seit ${age} min ohne Lebenszeichen (Story ${existing.story ?? "–"}). Übernehmen nur nach Rückfrage mit --takeover`,
          4,
        );
    }
  } else {
    n = 1;
    while (!tryMkdir(path.join(slotsDir, String(n)))) n++;
  }

  const { worktree, hash, notes } = prepareWorktree(n);
  const previous = readSlot(n) || {};
  saveSlot(n, {
    slot: n,
    worktree,
    ports: portsOf(n),
    lockHash: hash,
    story: previous.story ?? null,
    epic: previous.epic ?? null,
    branch: previous.branch ?? null,
    phase: previous.phase ?? "belegt",
  });
  if (flags.story) lockStory(n, storyNumber(flags.story), flags.epic, takeover);
  console.log(
    JSON.stringify(
      {
        ...readSlot(n),
        notes,
        head: git(worktree, "rev-parse", "--abbrev-ref", "HEAD").out,
      },
      null,
      2,
    ),
  );
}

function busyFiles(n) {
  const out = [];
  for (const s of activeSlots()) {
    if (s.slot === n || !s.worktree || !fs.existsSync(s.worktree)) continue;
    // Committed and uncommitted changes against the shared base.
    const base =
      git(s.worktree, "merge-base", "HEAD", "origin/main").out || "origin/main";
    const files = git(s.worktree, "diff", "--name-only", base)
      .out.split("\n")
      .filter(Boolean);
    const untracked = git(
      s.worktree,
      "ls-files",
      "--others",
      "--exclude-standard",
    )
      .out.split("\n")
      .filter(Boolean);
    const all = [...new Set([...files, ...untracked])];
    out.push({
      slot: s.slot,
      story: s.story ?? null,
      epic: s.epic ?? null,
      hot: all.filter((f) => HOT_FILES.includes(f)),
      files: all,
    });
  }
  return out;
}

function mergeLockAcquire(n) {
  const waitMinutes = Number(flags.wait ?? 9);
  const deadline = Date.now() + waitMinutes * 60000;
  let reported = false;
  for (;;) {
    if (tryMkdir(mergeLock)) {
      writeJson(path.join(mergeLock, "owner.json"), { slot: n, since: now() });
      saveSlot(n, { phase: "Merge-Sperre gehalten" });
      console.log(`Merge-Sperre für Platz ${n}`);
      return;
    }
    const owner = readJson(path.join(mergeLock, "owner.json"));
    if (owner?.slot === n) {
      console.log(`Merge-Sperre hält Platz ${n} bereits`);
      return;
    }
    const ownerSlot = owner ? readSlot(owner.slot) : null;
    if (!owner || ageMinutes(owner.since) > MERGE_STALE_MINUTES || !ownerSlot) {
      console.log(
        `Verwaiste Merge-Sperre (Platz ${owner?.slot ?? "?"}) aufgehoben`,
      );
      fs.rmSync(mergeLock, { recursive: true, force: true });
      continue;
    }
    if (!reported) {
      console.log(
        `Warte auf Merge-Sperre, hält Platz ${owner.slot} (Story ${ownerSlot?.story ?? "–"}) seit ${Math.round(ageMinutes(owner.since))} min`,
      );
      reported = true;
    }
    if (Date.now() > deadline)
      fail(
        `Merge-Sperre nach ${waitMinutes} min noch bei Platz ${owner.slot}`,
        5,
      );
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 15000);
  }
}

function printStatus() {
  const slots = activeSlots();
  const merge = readJson(path.join(mergeLock, "owner.json"));
  if (flags.json) {
    console.log(JSON.stringify({ slots, mergeLock: merge }, null, 2));
    return;
  }
  if (!slots.length) console.log("Keine belegten Plätze.");
  for (const s of slots) {
    const age = Math.round(ageMinutes(s.updated));
    const state = isStale(s)
      ? `ohne Lebenszeichen seit ${age} min`
      : `aktiv vor ${age} min`;
    console.log(
      `Platz ${s.slot}: Story ${s.story ?? "–"} · Epic ${s.epic ?? "–"} · ${s.branch ?? "kein Branch"} · ${s.phase ?? ""} · ${state}`,
    );
  }
  console.log(
    merge
      ? `Merge-Sperre: Platz ${merge.slot} seit ${Math.round(ageMinutes(merge.since))} min`
      : "Merge-Sperre: frei",
  );
}

switch (command) {
  case "claim":
    claim();
    break;
  case "take-story": {
    const n = slotNumber(args[0]);
    requireSlot(n);
    const slot = lockStory(
      n,
      storyNumber(args[1]),
      flags.epic,
      Boolean(flags.takeover),
    );
    console.log(`Story ${slot.story} gehört Platz ${n}`);
    break;
  }
  case "update": {
    const n = slotNumber(args[0]);
    requireSlot(n);
    const changes = {};
    for (const key of ["branch", "epic", "phase"])
      if (typeof flags[key] === "string") changes[key] = flags[key];
    saveSlot(n, changes);
    console.log(`Platz ${n} aktualisiert`);
    break;
  }
  case "busy-files": {
    const n = slotNumber(args[0]);
    console.log(JSON.stringify(busyFiles(n), null, 2));
    break;
  }
  case "merge-lock":
    mergeLockAcquire(slotNumber(args[0]));
    break;
  case "merge-unlock": {
    const n = slotNumber(args[0]);
    const owner = readJson(path.join(mergeLock, "owner.json"));
    if (owner && owner.slot !== n)
      fail(`Merge-Sperre gehört Platz ${owner.slot}`);
    fs.rmSync(mergeLock, { recursive: true, force: true });
    if (readSlot(n)) saveSlot(n, { phase: "Merge-Sperre freigegeben" });
    console.log("Merge-Sperre frei");
    break;
  }
  case "release-story": {
    const n = slotNumber(args[0]);
    const slot = requireSlot(n);
    if (slot.story) unlockStory(n, slot.story);
    saveSlot(n, { story: null, epic: null, branch: null, phase: "ohne Story" });
    console.log(`Platz ${n} hat keine Story mehr`);
    break;
  }
  case "release":
  case "remove": {
    const n = slotNumber(args[0]);
    const slot = requireSlot(n);
    if (slot.story) unlockStory(n, slot.story);
    const owner = readJson(path.join(mergeLock, "owner.json"));
    if (owner?.slot === n)
      fs.rmSync(mergeLock, { recursive: true, force: true });
    if (command === "remove") {
      const worktree = worktreeOf(n);
      if (fs.existsSync(worktree)) {
        if (git(worktree, "status", "--porcelain").out)
          fail(
            `Worktree ${worktree} hat uncommittete Änderungen, nicht gelöscht`,
          );
        const removed = git(mainRepo, "worktree", "remove", worktree);
        if (!removed.ok) fail(removed.err);
      }
      fs.rmSync(path.join(slotsDir, String(n)), {
        recursive: true,
        force: true,
      });
      console.log(`Platz ${n} und Worktree entfernt`);
    } else {
      saveSlot(n, { story: null, epic: null, branch: null, phase: "frei" });
      fs.rmSync(path.join(slotsDir, String(n)), {
        recursive: true,
        force: true,
      });
      console.log(`Platz ${n} frei, Worktree bleibt für die nächste Sitzung`);
    }
    break;
  }
  case "status":
    printStatus();
    break;
  default:
    console.error(
      "Aufruf: node session.mjs claim|take-story|update|busy-files|merge-lock|merge-unlock|release-story|release|remove|status",
    );
    process.exit(2);
}
