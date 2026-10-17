#!/usr/bin/env bash
# Starts a M.oach skill with the Codex profile assigned in docs/workflow.md, section 10.
set -u

usage() {
  printf 'Aufruf: scripts/codex-skill.sh [--dry-run] <skill> [argumente]\n'
}

dry_run=false
if [ "${1:-}" = "--dry-run" ]; then
  dry_run=true
  shift
fi

skill=${1:-}
if [ -z "$skill" ]; then
  usage >&2
  exit 2
fi
shift

if [ "${1:-}" = "--dry-run" ]; then
  dry_run=true
  shift
fi

case "$skill" in
  plan-taiga-epic|implement-taiga-ticket|qa-taiga-ticket)
    profile=moach-deep
    ;;
  triage-taiga-issues|plan-taiga-sprint|finish-taiga-ticket)
    profile=moach-routine
    ;;
  *)
    printf 'Unbekannter Skill: %s\n' "$skill" >&2
    printf 'Die unterstützten Skills und Profile stehen in docs/workflow.md, Abschnitt 10.\n' >&2
    exit 2
    ;;
esac

profile_file="$HOME/.codex/$profile.config.toml"
if [ ! -f "$profile_file" ]; then
  printf 'Codex-Profil fehlt: %s\n' "$profile_file" >&2
  printf 'Richte es nach docs/workflow.md, Abschnitt 10 ein.\n' >&2
  exit 1
fi

prompt="\$$skill"
if [ "$#" -gt 0 ]; then
  prompt="$prompt $*"
fi

if [ "$dry_run" = true ]; then
  printf 'codex --profile %q %q\n' "$profile" "$prompt"
  exit 0
fi

exec codex --profile "$profile" "$prompt"
