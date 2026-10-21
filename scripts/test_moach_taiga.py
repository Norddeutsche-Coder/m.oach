# Unit tests for the pure Discord/Taiga helpers in moach_taiga.py.
# No network, no environment variables, no dates.
# Run: python3 -m unittest discover -s scripts -p 'test_*.py'
import argparse
import contextlib
import importlib.util
import io
import os
import sys
import unittest
import urllib.error
from pathlib import Path
from unittest import mock

_SPEC = importlib.util.spec_from_file_location("moach_taiga", Path(__file__).with_name("moach_taiga.py"))
mt = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(mt)

GUILD_ID = "1561383271823315024"
BUGS_CHANNEL_ID = "1561383271823315100"
OTHER_CHANNEL_ID = "1561383271823315200"
THREAD_ID = "1561383271823315555"
MESSAGE_ID = "1561383271823315999"
THREAD_LINK = f"https://discord.com/channels/{GUILD_ID}/{THREAD_ID}"

# Forum tag names to made-up tag IDs.
TAG_IDS = {
    "Neu": "900000000000000001",
    "Bestätigt": "900000000000000002",
    "Behoben": "900000000000000003",
    "In Taiga": "900000000000000004",
    "Kein Bug": "900000000000000005",
    "iPhone": "900000000000000006",
    "Android": "900000000000000007",
    "Desktop": "900000000000000008",
}
TAG_NAMES = {v: k for k, v in TAG_IDS.items()}

REPORTER_ID = "777000000000000123"
REPORTER_NAME = "laeuferin_lena"


def ids(*names):
    return [TAG_IDS[n] for n in names]


class ConstantsTest(unittest.TestCase):
    def test_tag_names(self):
        self.assertEqual(mt.TAG_NEW, "Neu")
        self.assertEqual(mt.TAG_CONFIRMED, "Bestätigt")
        self.assertEqual(mt.TAG_FIXED, "Behoben")
        self.assertEqual(mt.TAG_IN_TAIGA, "In Taiga")
        self.assertEqual(mt.TAG_NO_BUG, "Kein Bug")

    def test_device_tags_order(self):
        self.assertEqual(mt.DEVICE_TAGS, ("iPhone", "Android", "Desktop"))

    def test_live_statuses(self):
        self.assertEqual(mt.LIVE_STATUSES, {"Abnahme", "Fertig", "Archiviert"})

    def test_app_url(self):
        self.assertEqual(mt.APP_URL, "https://norddeutsche-coder.github.io/m.oach/")


class NewsRefsTest(unittest.TestCase):
    def test_single_line(self):
        self.assertEqual(mt.news_refs("- 2026-10-18: Plan zeigt Wochenlast (#88)"), {88})

    def test_multiple_lines(self):
        wiki = ("# Neuigkeiten\n"
                "- 2026-10-18: Plan zeigt Wochenlast (#88)\n"
                "- 2026-10-11: Kalender mit Wochenstart Montag (#7)\n"
                "- 2026-10-04: Readiness im Briefing (#123)\n")
        self.assertEqual(mt.news_refs(wiki), {7, 88, 123})

    def test_duplicates_collapse(self):
        self.assertEqual(mt.news_refs("(#5) und nochmal (#5)"), {5})

    def test_empty_text(self):
        self.assertEqual(mt.news_refs(""), set())

    def test_no_match(self):
        self.assertEqual(mt.news_refs("- 2026-10-18: Nur Text ohne Story"), set())

    def test_ref_without_parentheses_ignored(self):
        self.assertEqual(mt.news_refs("Siehe #12 und (#34)"), {34})


class EpicNewsDueTest(unittest.TestCase):
    def test_all_live_and_referenced(self):
        stories = [{"ref": 88, "status": "Fertig"}, {"ref": 89, "status": "Abnahme"},
                   {"ref": 90, "status": "Archiviert"}]
        self.assertTrue(mt.epic_news_due(stories, {88}))

    def test_one_open_story(self):
        stories = [{"ref": 88, "status": "Fertig"}, {"ref": 89, "status": "Im Test"}]
        self.assertFalse(mt.epic_news_due(stories, {88, 89}))

    def test_one_ready_story(self):
        stories = [{"ref": 88, "status": "Fertig"}, {"ref": 91, "status": "Bereit"}]
        self.assertFalse(mt.epic_news_due(stories, {88}))

    def test_empty_story_list(self):
        self.assertFalse(mt.epic_news_due([], {88}))

    def test_finished_without_visible_story(self):
        # Pure tech epic: all stories live, none listed in the news.
        stories = [{"ref": 40, "status": "Fertig"}, {"ref": 41, "status": "Archiviert"}]
        self.assertFalse(mt.epic_news_due(stories, {88, 99}))

    def test_no_refs_at_all(self):
        self.assertFalse(mt.epic_news_due([{"ref": 88, "status": "Fertig"}], set()))


class DiscordLinkTest(unittest.TestCase):
    def test_link_in_middle_of_description(self):
        desc = f"Plan lädt nicht.\n\n**Gerät:** iPhone\n\nDiscord: {THREAD_LINK}\n\nNachtrag vom Team."
        self.assertEqual(mt.discord_link(desc), THREAD_LINK)

    def test_link_as_last_line(self):
        self.assertEqual(mt.discord_link(f"Text\n\nDiscord: {THREAD_LINK}"), THREAD_LINK)

    def test_link_with_message_id(self):
        link = f"{THREAD_LINK}/{MESSAGE_ID}"
        self.assertEqual(mt.discord_link(f"Text\nDiscord: {link}\n"), link)

    def test_none(self):
        self.assertIsNone(mt.discord_link(None))

    def test_empty(self):
        self.assertIsNone(mt.discord_link(""))

    def test_no_discord_line(self):
        self.assertIsNone(mt.discord_link("Nur eine Beschreibung ohne Link."))

    def test_foreign_domain_not_found(self):
        self.assertIsNone(mt.discord_link(f"Discord: https://example.com/channels/{GUILD_ID}/{THREAD_ID}"))


class ParseThreadLinkTest(unittest.TestCase):
    def test_thread_link(self):
        self.assertEqual(mt.parse_thread_link(THREAD_LINK), (GUILD_ID, THREAD_ID))

    def test_link_with_message_id(self):
        self.assertEqual(mt.parse_thread_link(f"{THREAD_LINK}/{MESSAGE_ID}"), (GUILD_ID, THREAD_ID))

    def test_returns_strings(self):
        guild, thread = mt.parse_thread_link(THREAD_LINK)
        self.assertIsInstance(guild, str)
        self.assertIsInstance(thread, str)

    def test_invalid_links(self):
        invalid = [
            "",
            "kein Link",
            f"https://example.com/channels/{GUILD_ID}/{THREAD_ID}",
            f"https://discord.com/channels/{GUILD_ID}",
            f"https://discord.com/channels/{GUILD_ID}/",
            f"https://discord.com/channels/@me/{THREAD_ID}",
            "https://discord.com/channels/abc/def",
            f"https://discord.com/channels/{GUILD_ID}/abc",
        ]
        for link in invalid:
            with self.subTest(link=link):
                with self.assertRaises(ValueError):
                    mt.parse_thread_link(link)


class MessagePayloadTest(unittest.TestCase):
    def test_normal_text(self):
        self.assertEqual(mt.message_payload("Danke! Aufgenommen als #215."),
                         {"content": "Danke! Aufgenommen als #215.", "allowed_mentions": {"parse": []}, "flags": 4})

    def test_suppresses_mentions(self):
        payload = mt.message_payload("@everyone Behoben")
        self.assertEqual(payload["allowed_mentions"], {"parse": []})
        self.assertEqual(payload["content"], "@everyone Behoben")

    def test_exactly_2000_chars(self):
        text = "a" * 2000
        self.assertEqual(mt.message_payload(text)["content"], text)

    def test_2001_chars(self):
        with self.assertRaises(ValueError):
            mt.message_payload("a" * 2001)

    def test_empty(self):
        with self.assertRaises(ValueError):
            mt.message_payload("")

    def test_whitespace_only(self):
        with self.assertRaises(ValueError):
            mt.message_payload("   \n\t ")


class FixedTagsTest(unittest.TestCase):
    def test_replaces_new_with_fixed(self):
        self.assertEqual(mt.fixed_tags(ids("Neu", "iPhone"), TAG_IDS), ids("iPhone", "Behoben"))

    def test_removes_new_and_confirmed_keeps_order(self):
        applied = ids("Android", "Neu", "In Taiga", "Bestätigt", "iPhone")
        self.assertEqual(mt.fixed_tags(applied, TAG_IDS), ids("Android", "In Taiga", "iPhone", "Behoben"))

    def test_fixed_already_present(self):
        applied = ids("iPhone", "Behoben", "In Taiga")
        self.assertEqual(mt.fixed_tags(applied, TAG_IDS), ids("iPhone", "Behoben", "In Taiga"))

    def test_empty_applied(self):
        self.assertEqual(mt.fixed_tags([], TAG_IDS), ids("Behoben"))

    def test_exactly_five_keeps_no_bug(self):
        applied = ids("iPhone", "Android", "In Taiga", "Kein Bug")
        self.assertEqual(mt.fixed_tags(applied, TAG_IDS),
                         ids("iPhone", "Android", "In Taiga", "Kein Bug", "Behoben"))

    def test_over_five_drops_no_bug_first(self):
        applied = ids("iPhone", "Android", "Desktop", "In Taiga", "Kein Bug")
        self.assertEqual(mt.fixed_tags(applied, TAG_IDS),
                         ids("iPhone", "Android", "Desktop", "In Taiga", "Behoben"))

    def test_removing_new_frees_a_slot(self):
        applied = ids("Neu", "iPhone", "Android", "Desktop", "In Taiga")
        self.assertEqual(mt.fixed_tags(applied, TAG_IDS),
                         ids("iPhone", "Android", "Desktop", "In Taiga", "Behoben"))

    def test_never_more_than_five(self):
        applied = ids("Bestätigt", "iPhone", "Android", "Desktop", "In Taiga", "Kein Bug")
        result = mt.fixed_tags(applied, TAG_IDS)
        self.assertLessEqual(len(result), 5)
        self.assertNotIn(TAG_IDS["Bestätigt"], result)


def thread(tid, parent=BUGS_CHANNEL_ID, tags=(), name="Fehler"):
    return {"id": tid, "parent_id": parent, "applied_tags": ids(*tags), "name": name}


class NewBugThreadsTest(unittest.TestCase):
    SKIP = {TAG_IDS["In Taiga"], TAG_IDS["Kein Bug"]}

    def test_keeps_new_bug_threads(self):
        threads = [thread("101", tags=("Neu",)), thread("102", tags=("iPhone",))]
        self.assertEqual([t["id"] for t in mt.new_bug_threads(threads, BUGS_CHANNEL_ID, self.SKIP)], ["101", "102"])

    def test_skips_in_taiga_and_no_bug(self):
        threads = [thread("101", tags=("Neu", "In Taiga")), thread("102", tags=("Kein Bug",)),
                   thread("103", tags=("Neu",))]
        self.assertEqual([t["id"] for t in mt.new_bug_threads(threads, BUGS_CHANNEL_ID, self.SKIP)], ["103"])

    def test_skips_other_channel(self):
        threads = [thread("101", parent=OTHER_CHANNEL_ID), thread("102")]
        self.assertEqual([t["id"] for t in mt.new_bug_threads(threads, BUGS_CHANNEL_ID, self.SKIP)], ["102"])

    def test_deduplicates_active_and_archived(self):
        threads = [thread("101"), thread("102"), thread("101")]
        self.assertEqual([t["id"] for t in mt.new_bug_threads(threads, BUGS_CHANNEL_ID, self.SKIP)], ["101", "102"])

    def test_sorted_numerically_oldest_first(self):
        # "999" < "1000" numerically but not as strings.
        threads = [thread("1561383271823315024"), thread("1000"), thread("999")]
        self.assertEqual([t["id"] for t in mt.new_bug_threads(threads, BUGS_CHANNEL_ID, self.SKIP)],
                         ["999", "1000", "1561383271823315024"])

    def test_empty(self):
        self.assertEqual(mt.new_bug_threads([], BUGS_CHANNEL_ID, self.SKIP), [])


def starter(content):
    return {"content": content, "author": {"id": REPORTER_ID, "username": REPORTER_NAME}}


class IssueFromThreadTest(unittest.TestCase):
    def issue(self, content="Der Plan lädt nicht.", tags=("Neu", "iPhone"), name="Plan lädt nicht"):
        return mt.issue_from_thread(thread(THREAD_ID, tags=tags, name=name), starter(content), TAG_NAMES, GUILD_ID)

    def test_normal_case(self):
        self.assertEqual(self.issue(), {
            "subject": "Plan lädt nicht",
            "description": f"Der Plan lädt nicht.\n\n**Gerät:** iPhone\n\nDiscord: {THREAD_LINK}",
            "tags": ["bug"],
        })

    def test_subject_trimmed(self):
        self.assertEqual(self.issue(name="   Plan lädt nicht \n")["subject"], "Plan lädt nicht")

    def test_subject_max_200_chars(self):
        subject = self.issue(name="x" * 250)["subject"]
        self.assertLessEqual(len(subject), 200)
        self.assertTrue(subject.startswith("x" * 190))

    def test_subject_exactly_200_kept(self):
        self.assertEqual(self.issue(name="y" * 200)["subject"], "y" * 200)

    def test_devices_in_device_tag_order(self):
        desc = self.issue(tags=("Desktop", "Neu", "iPhone"))["description"]
        self.assertIn("\n\n**Gerät:** iPhone, Desktop\n\n", desc)

    def test_all_devices(self):
        desc = self.issue(tags=("Android", "Desktop", "iPhone"))["description"]
        self.assertIn("**Gerät:** iPhone, Android, Desktop", desc)

    def test_without_device(self):
        desc = self.issue(tags=("Neu",))["description"]
        self.assertEqual(desc, f"Der Plan lädt nicht.\n\n**Gerät:** nicht angegeben\n\nDiscord: {THREAD_LINK}")

    def test_empty_post(self):
        desc = self.issue(content="")["description"]
        self.assertTrue(desc.startswith("(kein Text)\n\n**Gerät:**"))

    def test_user_mentions_replaced(self):
        desc = self.issue(content="Wie <@123456789012345678> und <@!987654321098765432> schon sagten")["description"]
        self.assertTrue(desc.startswith("Wie @jemand und @jemand schon sagten\n\n"))
        self.assertNotIn("123456789012345678", desc)
        self.assertNotIn("987654321098765432", desc)

    def test_everyone_stays_as_text(self):
        desc = self.issue(content="@everyone der Plan ist leer")["description"]
        self.assertTrue(desc.startswith("@everyone der Plan ist leer\n\n"))

    def test_reporter_not_in_issue(self):
        result = self.issue(content="Melde mich als Läuferin.")
        text = repr(result)
        self.assertNotIn(REPORTER_ID, text)
        self.assertNotIn(REPORTER_NAME, text)

    def test_last_line_is_discord_link(self):
        desc = self.issue()["description"]
        self.assertEqual(desc.splitlines()[-1], f"Discord: {THREAD_LINK}")

    def test_link_roundtrip(self):
        desc = self.issue(content="Mehrzeilig\nzweite Zeile")["description"]
        self.assertEqual(mt.discord_link(desc), THREAD_LINK)
        self.assertEqual(mt.parse_thread_link(mt.discord_link(desc)), (GUILD_ID, THREAD_ID))


class TextTemplatesTest(unittest.TestCase):
    def test_thanks_text(self):
        self.assertEqual(mt.thanks_text(215), "Danke! Aufgenommen als #215.")

    def test_epic_news_text(self):
        self.assertEqual(mt.epic_news_text("Wochenlast", "Der Plan zeigt jetzt die Wochenlast."),
                         "🎉 **Wochenlast**\nDer Plan zeigt jetzt die Wochenlast.\n"
                         "https://norddeutsche-coder.github.io/m.oach/")

    def test_bug_news_text(self):
        self.assertEqual(mt.bug_news_text("Der Plan lädt wieder."), "Behoben: Der Plan lädt wieder.")

    def test_bug_fixed_reply(self):
        link = f"https://discord.com/channels/{GUILD_ID}/1561383271823315300/{MESSAGE_ID}"
        self.assertEqual(mt.bug_fixed_reply(link), f"Behoben ✅ Mehr dazu: {link}")


class InTaigaTagsTest(unittest.TestCase):
    def test_empty_applied(self):
        self.assertEqual(mt.in_taiga_tags([], TAG_IDS), ids("In Taiga"))

    def test_already_present_unchanged(self):
        applied = ids("Neu", "In Taiga", "iPhone")
        self.assertEqual(mt.in_taiga_tags(applied, TAG_IDS), ids("Neu", "In Taiga", "iPhone"))

    def test_three_tags_appended_in_order(self):
        applied = ids("Neu", "Android", "Desktop")
        self.assertEqual(mt.in_taiga_tags(applied, TAG_IDS), ids("Neu", "Android", "Desktop", "In Taiga"))

    def test_exactly_four_tags_keeps_all(self):
        applied = ids("Neu", "iPhone", "Android", "Desktop")
        self.assertEqual(mt.in_taiga_tags(applied, TAG_IDS),
                         ids("Neu", "iPhone", "Android", "Desktop", "In Taiga"))

    def test_exactly_five_with_new_drops_new(self):
        applied = ids("Neu", "Bestätigt", "iPhone", "Android", "Desktop")
        self.assertEqual(mt.in_taiga_tags(applied, TAG_IDS),
                         ids("Bestätigt", "iPhone", "Android", "Desktop", "In Taiga"))

    def test_exactly_five_without_new_drops_last(self):
        applied = ids("Bestätigt", "iPhone", "Android", "Desktop", "Kein Bug")
        self.assertEqual(mt.in_taiga_tags(applied, TAG_IDS),
                         ids("Bestätigt", "iPhone", "Android", "Desktop", "In Taiga"))

    def test_never_more_than_five(self):
        applied = ids("Bestätigt", "iPhone", "Android", "Desktop", "Kein Bug", "Behoben")
        result = mt.in_taiga_tags(applied, TAG_IDS)
        self.assertLessEqual(len(result), 5)
        self.assertIn(TAG_IDS["In Taiga"], result)

    def test_no_duplicate(self):
        for applied in ([], ids("In Taiga"), ids("Neu", "iPhone", "In Taiga", "Android", "Desktop"),
                        ids("Neu", "Bestätigt", "iPhone", "Android", "Desktop")):
            result = mt.in_taiga_tags(applied, TAG_IDS)
            self.assertEqual(result.count(TAG_IDS["In Taiga"]), 1)
            self.assertEqual(len(result), len(set(result)))


def described(ref, link):
    return {"ref": ref, "description": f"Der Plan lädt nicht.\n\n**Gerät:** iPhone\n\nDiscord: {link}"}


class IssueRefForLinkTest(unittest.TestCase):
    def test_match_in_middle_of_description(self):
        issues = [described(12, f"https://discord.com/channels/{GUILD_ID}/1561383271823315111"),
                  {"ref": 14, "description": f"Text oben\nDiscord: {THREAD_LINK}\nText unten"},
                  described(15, THREAD_LINK)]
        self.assertEqual(mt.issue_ref_for_link(issues, THREAD_LINK), 14)

    def test_no_match(self):
        issues = [described(12, f"https://discord.com/channels/{GUILD_ID}/1561383271823315111"),
                  {"ref": 13, "description": "Ohne Discord-Link"}]
        self.assertIsNone(mt.issue_ref_for_link(issues, THREAD_LINK))

    def test_description_none(self):
        issues = [{"ref": 11, "description": None}, described(16, THREAD_LINK)]
        self.assertEqual(mt.issue_ref_for_link(issues, THREAD_LINK), 16)
        self.assertIsNone(mt.issue_ref_for_link([{"ref": 11, "description": None}], THREAD_LINK))

    def test_similar_link_other_thread_id(self):
        issues = [described(17, THREAD_LINK + "1"), described(18, THREAD_LINK[:-1] + "6")]
        self.assertIsNone(mt.issue_ref_for_link(issues, THREAD_LINK))

    def test_empty_list(self):
        self.assertIsNone(mt.issue_ref_for_link([], THREAD_LINK))


FIRST_ID = "1561383271823315401"
SECOND_ID = "1561383271823315402"


def link_of(tid):
    return f"https://discord.com/channels/{GUILD_ID}/{tid}"


class ImportBugThreadsTest(unittest.TestCase):
    def run_import(self, threads, starters, existing=None, create_error=None):
        calls, next_ref = [], iter([301, 302, 303])
        existing = existing or {}

        def fetch_starter(tid):
            calls.append(("fetch_starter", tid))
            return starters.get(tid)

        def find_issue(link):
            calls.append(("find_issue", link))
            return existing.get(link)

        def create_issue(data):
            calls.append(("create_issue", data))
            if create_error:
                raise create_error
            return next(next_ref)

        def set_tags(th, tags):
            calls.append(("set_tags", th["id"], tags))

        def reply(tid, text):
            calls.append(("reply", tid, text))

        refs = mt.import_bug_threads(threads, TAG_IDS, GUILD_ID, fetch_starter, find_issue,
                                     create_issue, set_tags, reply)
        return refs, calls

    def test_call_order_create_then_tag_then_reply(self):
        threads = [thread(FIRST_ID, tags=("Neu", "iPhone"), name="Plan lädt nicht"),
                   thread(SECOND_ID, tags=("Android",), name="Kalender leer")]
        starters = {FIRST_ID: {"content": "Seit heute weiß."}, SECOND_ID: {"content": "Nichts zu sehen."}}
        refs, calls = self.run_import(threads, starters)
        self.assertEqual(refs, [301, 302])
        self.assertEqual([c[0] for c in calls],
                         ["fetch_starter", "find_issue", "create_issue", "set_tags", "reply"] * 2)
        self.assertEqual(calls[1], ("find_issue", link_of(FIRST_ID)))
        self.assertEqual(calls[2][1]["subject"], "Plan lädt nicht")
        self.assertEqual(calls[3], ("set_tags", FIRST_ID, mt.in_taiga_tags(ids("Neu", "iPhone"), TAG_IDS)))
        self.assertEqual(calls[4], ("reply", FIRST_ID, mt.thanks_text(301)))
        self.assertEqual(calls[9], ("reply", SECOND_ID, mt.thanks_text(302)))

    def test_issue_data_from_thread(self):
        th = thread(FIRST_ID, tags=("Neu", "iPhone"), name="Plan lädt nicht")
        starter = {"content": "Seit heute weiß."}
        _, calls = self.run_import([th], {FIRST_ID: starter})
        create = [c for c in calls if c[0] == "create_issue"]
        self.assertEqual(create, [("create_issue", mt.issue_from_thread(th, starter, TAG_NAMES, GUILD_ID))])

    def test_deleted_starter_does_not_block_others(self):
        threads = [thread(FIRST_ID, tags=("Neu",), name="Erste Nachricht gelöscht"),
                   thread(SECOND_ID, tags=("Neu",), name="Zweiter Fehler")]
        refs, calls = self.run_import(threads, {SECOND_ID: {"content": "Text da."}})
        self.assertEqual(refs, [301, 302])
        creates = [c[1] for c in calls if c[0] == "create_issue"]
        self.assertIn("(kein Text)", creates[0]["description"])
        self.assertIn("Text da.", creates[1]["description"])
        self.assertEqual([c[1] for c in calls if c[0] == "reply"], [FIRST_ID, SECOND_ID])

    def test_existing_issue_not_created_again(self):
        threads = [thread(FIRST_ID, tags=("Neu", "Desktop"), name="Schon importiert")]
        refs, calls = self.run_import(threads, {FIRST_ID: {"content": "Doppelt?"}},
                                      existing={link_of(FIRST_ID): 250})
        self.assertEqual(refs, [250])
        self.assertNotIn("create_issue", [c[0] for c in calls])
        self.assertIn(("set_tags", FIRST_ID, mt.in_taiga_tags(ids("Neu", "Desktop"), TAG_IDS)), calls)
        self.assertIn(("reply", FIRST_ID, mt.thanks_text(250)), calls)

    def test_create_error_not_swallowed_and_no_tag(self):
        threads = [thread(FIRST_ID, tags=("Neu",), name="Taiga down"),
                   thread(SECOND_ID, tags=("Neu",), name="Danach")]
        with self.assertRaises(RuntimeError):
            self.run_import(threads, {FIRST_ID: {"content": "x"}, SECOND_ID: {"content": "y"}},
                            create_error=RuntimeError("Taiga-Anfrage fehlgeschlagen"))

    def test_create_error_records_no_set_tags(self):
        calls = []

        def create_issue(_):
            calls.append("create_issue")
            raise RuntimeError("Taiga-Anfrage fehlgeschlagen")

        with self.assertRaises(RuntimeError):
            mt.import_bug_threads([thread(FIRST_ID, tags=("Neu",))], TAG_IDS, GUILD_ID,
                                  lambda tid: {"content": "x"}, lambda link: None, create_issue,
                                  lambda th, tags: calls.append("set_tags"),
                                  lambda tid, text: calls.append("reply"))
        self.assertEqual(calls, ["create_issue"])

    def test_empty_list(self):
        refs, calls = self.run_import([], {})
        self.assertEqual(refs, [])
        self.assertEqual(calls, [])

    def test_reply_text_is_thanks_text(self):
        refs, calls = self.run_import([thread(FIRST_ID, tags=("Neu",))], {FIRST_ID: {"content": "x"}})
        self.assertEqual([c for c in calls if c[0] == "reply"], [("reply", FIRST_ID, "Danke! Aufgenommen als #301.")])


WEBHOOK_URL = "https://discord.com/api/webhooks/123/geheim-webhook-token"


def http_error(code, url="https://example.invalid/"):
    return urllib.error.HTTPError(url, code, "Not Found" if code == 404 else "Error", {}, io.BytesIO(b"{}"))


def exit_message(cm):
    return str(cm.exception.code)


class DiscordCallErrorsTest(unittest.TestCase):
    def test_timeout_is_readable_exit(self):
        with mock.patch("urllib.request.urlopen", side_effect=TimeoutError("timed out")):
            with self.assertRaises(SystemExit) as cm:
                mt.discord_call("GET", "/channels/1/threads/archived/public")
        self.assertTrue(exit_message(cm).startswith("Discord nicht erreichbar"), exit_message(cm))

    def test_webhook_url_hidden_on_timeout(self):
        with mock.patch("urllib.request.urlopen", side_effect=TimeoutError("timed out")):
            with self.assertRaises(SystemExit) as cm:
                mt.discord_call("POST", WEBHOOK_URL, {"content": "Hallo"})
        self.assertIn("Webhook", exit_message(cm))
        self.assertNotIn("geheim-webhook-token", exit_message(cm))

    def test_webhook_url_hidden_on_http_error(self):
        with mock.patch("urllib.request.urlopen", side_effect=http_error(403, WEBHOOK_URL)):
            with self.assertRaises(SystemExit) as cm:
                mt.discord_call("POST", WEBHOOK_URL, {"content": "Hallo"})
        self.assertIn("Webhook", exit_message(cm))
        self.assertNotIn("geheim-webhook-token", exit_message(cm))

    def test_bot_token_hidden(self):
        for err in (TimeoutError("timed out"), urllib.error.URLError("bot-geheim"), http_error(401)):
            with mock.patch("urllib.request.urlopen", side_effect=err):
                with self.assertRaises(SystemExit) as cm:
                    mt.discord_call("GET", "/guilds/1/threads/active", token="bot-geheim")
            self.assertNotIn("bot-geheim", exit_message(cm))

    def test_404_allowed_returns_none(self):
        with mock.patch("urllib.request.urlopen", side_effect=http_error(404)):
            self.assertIsNone(mt.discord_call("GET", "/channels/1/messages/2", allow_404=True))

    def test_404_not_allowed_exits(self):
        with mock.patch("urllib.request.urlopen", side_effect=http_error(404)):
            with self.assertRaises(SystemExit) as cm:
                mt.discord_call("GET", "/channels/1/messages/2")
        self.assertIn("HTTP 404", exit_message(cm))


def bare_taiga(token=None):
    t = mt.Taiga.__new__(mt.Taiga)
    t.token = token
    return t


class TaigaCallErrorsTest(unittest.TestCase):
    def test_url_error_is_readable_exit(self):
        with mock.patch("urllib.request.urlopen", side_effect=urllib.error.URLError("no route")):
            with self.assertRaises(SystemExit) as cm:
                bare_taiga().call("GET", "/projects/by_slug?slug=fynndow-moach")
        self.assertTrue(exit_message(cm).startswith("Taiga nicht erreichbar"), exit_message(cm))

    def test_timeout_is_readable_exit(self):
        with mock.patch("urllib.request.urlopen", side_effect=TimeoutError("timed out")):
            with self.assertRaises(SystemExit) as cm:
                bare_taiga().call("GET", "/issues?project=1")
        self.assertTrue(exit_message(cm).startswith("Taiga nicht erreichbar"), exit_message(cm))

    def test_http_401(self):
        with mock.patch("urllib.request.urlopen", side_effect=http_error(401)):
            with self.assertRaises(SystemExit) as cm:
                bare_taiga().call("GET", "/users/me")
        self.assertIn("Taiga-Anfrage fehlgeschlagen", exit_message(cm))
        self.assertIn("HTTP 401", exit_message(cm))

    def test_query_hidden_path_shown(self):
        path = "/issues?project=1&q=geheim-query"
        for err in (http_error(500, "https://api.taiga.io/api/v1" + path), TimeoutError("timed out"),
                    urllib.error.URLError("no route")):
            with mock.patch("urllib.request.urlopen", side_effect=err):
                with self.assertRaises(SystemExit) as cm:
                    bare_taiga().call("GET", path)
            self.assertNotIn("geheim-query", exit_message(cm))
            self.assertIn("/issues", exit_message(cm))

    def test_body_hidden(self):
        for err in (http_error(401), TimeoutError("timed out")):
            with mock.patch("urllib.request.urlopen", side_effect=err):
                with self.assertRaises(SystemExit) as cm:
                    bare_taiga().call("POST", "/auth", {"password": "geheim-passwort"})
            self.assertNotIn("geheim-passwort", exit_message(cm))

    def test_token_hidden(self):
        for err in (http_error(403), TimeoutError("timed out"), urllib.error.URLError("no route")):
            with mock.patch("urllib.request.urlopen", side_effect=err):
                with self.assertRaises(SystemExit) as cm:
                    bare_taiga("geheim-token").call("GET", "/users/me")
            self.assertNotIn("geheim-token", exit_message(cm))


# --- TG-216: welcome message with the "Ich will testen" button --------------------

HANDLER_TS = (Path(__file__).resolve().parent.parent / "backend" / "supabase" / "functions"
              / "discord-interactions" / "handler.ts")
BOT_ID = "1561400000000000777"
OTHER_AUTHOR_ID = "777000000000000456"
WELCOME_CHANNEL_ID = "1561383271823315300"
NEWS_CHANNEL_ID = "1561383271823315400"
OLD_WELCOME_ID = "1561383271823315888"
NEW_WELCOME_ID = "1561383271823316001"
FAKE_BOT_TOKEN = "bot-geheim"
OLD_SCREEN_DESCRIPTION = "Schreib dem Bot eine Direktnachricht, um Testläufer zu werden."


def message(msg_id, author_id, content):
    return {"id": msg_id, "author": {"id": author_id}, "content": content}


class WelcomeConstantsTest(unittest.TestCase):
    def test_join_id(self):
        self.assertEqual(mt.TESTER_JOIN_ID, "moach_tester_join")

    def test_join_id_matches_edge_function(self):
        # The button id must be the same on both sides, otherwise clicks are rejected.
        self.assertIn("'moach_tester_join'", HANDLER_TS.read_text(encoding="utf-8"))

    def test_names(self):
        self.assertEqual(mt.WELCOME_CHANNEL, "willkommen")
        self.assertEqual(mt.WELCOME_HEADING, "# Willkommen bei M.oach")
        self.assertEqual(mt.WELCOME_BUTTON_LABEL, "Ich will testen")


class WelcomeTextsTest(unittest.TestCase):
    def test_message_starts_with_heading(self):
        self.assertTrue(mt.WELCOME_MESSAGE.startswith(mt.WELCOME_HEADING), mt.WELCOME_MESSAGE[:80])

    def test_message_fits_discord_limit(self):
        self.assertLessEqual(len(mt.WELCOME_MESSAGE), 2000)

    def test_message_mentions_button(self):
        self.assertIn("Ich will testen", mt.WELCOME_MESSAGE)

    def test_message_without_direct_message_hint(self):
        self.assertNotIn("direktnachricht", mt.WELCOME_MESSAGE.lower())

    def test_message_links_app(self):
        self.assertIn(mt.APP_URL, mt.WELCOME_MESSAGE)

    def test_screen_description_fits_limit(self):
        self.assertLessEqual(len(mt.WELCOME_SCREEN_DESCRIPTION), 140)

    def test_screen_description_mentions_button(self):
        self.assertIn("Ich will testen", mt.WELCOME_SCREEN_DESCRIPTION)

    def test_screen_description_without_direct_message_hint(self):
        self.assertNotIn("direktnachricht", mt.WELCOME_SCREEN_DESCRIPTION.lower())


class WelcomePayloadTest(unittest.TestCase):
    def test_exact_structure(self):
        self.assertEqual(mt.welcome_payload(), {
            "content": mt.WELCOME_MESSAGE,
            "components": [{"type": 1, "components": [{
                "type": 2, "style": 3, "label": "Ich will testen", "custom_id": "moach_tester_join",
            }]}],
            "allowed_mentions": {"parse": []},
        })

    def test_no_pings(self):
        self.assertEqual(mt.welcome_payload()["allowed_mentions"]["parse"], [])

    def test_fresh_dict_each_call(self):
        first = mt.welcome_payload()
        first["components"].clear()
        self.assertEqual(len(mt.welcome_payload()["components"]), 1)


class FindWelcomeMessageTest(unittest.TestCase):
    def test_finds_bot_message(self):
        own = message(OLD_WELCOME_ID, BOT_ID, mt.WELCOME_HEADING + "\nAlter Text")
        messages = [message("3", OTHER_AUTHOR_ID, "Hallo zusammen"), own]
        self.assertEqual(mt.find_welcome_message(messages, BOT_ID), own)

    def test_ignores_same_text_from_other_author(self):
        messages = [message("3", OTHER_AUTHOR_ID, mt.WELCOME_MESSAGE)]
        self.assertIsNone(mt.find_welcome_message(messages, BOT_ID))

    def test_ignores_other_bot_messages(self):
        messages = [message("3", BOT_ID, "🎉 **Wochenlast**\nNeu im Plan.")]
        self.assertIsNone(mt.find_welcome_message(messages, BOT_ID))

    def test_empty_list(self):
        self.assertIsNone(mt.find_welcome_message([], BOT_ID))

    def test_first_of_several(self):
        newest = message("5", BOT_ID, mt.WELCOME_HEADING + "\nNeu")
        older = message("4", BOT_ID, mt.WELCOME_HEADING + "\nAlt")
        self.assertEqual(mt.find_welcome_message([newest, older], BOT_ID), newest)


class WelcomeScreenPatchTest(unittest.TestCase):
    def test_none_needs_patch(self):
        self.assertEqual(mt.welcome_screen_patch(None), {"description": mt.WELCOME_SCREEN_DESCRIPTION})

    def test_old_description_needs_patch(self):
        current = {"description": OLD_SCREEN_DESCRIPTION, "welcome_channels": []}
        self.assertEqual(mt.welcome_screen_patch(current), {"description": mt.WELCOME_SCREEN_DESCRIPTION})

    def test_current_description_no_patch(self):
        current = {"description": mt.WELCOME_SCREEN_DESCRIPTION, "welcome_channels": []}
        self.assertIsNone(mt.welcome_screen_patch(current))


class FakeDiscord:
    """Answers discord_call by method and path and records every call."""

    def __init__(self, messages=(), screen=None, channels=None):
        self.messages = list(messages)
        self.screen = screen
        self.channels = channels if channels is not None else [
            {"id": NEWS_CHANNEL_ID, "name": "neuigkeiten", "type": 0},
            {"id": WELCOME_CHANNEL_ID, "name": "willkommen", "type": 0},
            {"id": BUGS_CHANNEL_ID, "name": "bugs", "type": 15},
        ]
        self.calls = []

    def __call__(self, method, path, body=None, token=None, allow_404=False):
        self.calls.append({"method": method, "path": path, "body": body, "token": token,
                           "allow_404": allow_404})
        guild = mt.DISCORD_GUILD_ID
        base = path.split("?")[0]
        if method == "GET" and base == "/users/@me":
            return {"id": BOT_ID, "username": "M.oach", "bot": True}
        if method == "GET" and base == f"/guilds/{guild}/channels":
            return self.channels
        if method == "GET" and base == f"/channels/{WELCOME_CHANNEL_ID}/messages":
            return self.messages
        if method == "GET" and base == f"/guilds/{guild}/welcome-screen":
            return self.screen
        if method == "POST" and base == f"/channels/{WELCOME_CHANNEL_ID}/messages":
            return {"id": NEW_WELCOME_ID, "author": {"id": BOT_ID}, **body}
        if method == "PATCH" and base.startswith(f"/channels/{WELCOME_CHANNEL_ID}/messages/"):
            return {"id": base.rsplit("/", 1)[1], "author": {"id": BOT_ID}, **body}
        if method == "PUT" and base.startswith(f"/channels/{WELCOME_CHANNEL_ID}/pins/"):
            return {}
        if method == "PATCH" and base == f"/guilds/{guild}/welcome-screen":
            return {"welcome_channels": [], **body}
        raise AssertionError(f"unexpected Discord call: {method} {path}")

    def writes(self):
        return [(c["method"], c["path"]) for c in self.calls if c["method"] != "GET"]


def old_welcome():
    return message(OLD_WELCOME_ID, BOT_ID, mt.WELCOME_HEADING + "\nSchreib dem Bot eine Direktnachricht.")


def current_screen():
    return {"description": mt.WELCOME_SCREEN_DESCRIPTION, "welcome_channels": []}


class DiscordWelcomeCommandTest(unittest.TestCase):
    def run_welcome(self, fake, dry_run=False, token=FAKE_BOT_TOKEN):
        out = io.StringIO()
        with mock.patch.dict(os.environ, {"DISCORD_BOT_TOKEN": token}), \
                mock.patch.object(mt, "discord_call", side_effect=fake), \
                contextlib.redirect_stdout(out):
            mt.cmd_discord_welcome(None, argparse.Namespace(dry_run=dry_run))
        return out.getvalue()

    def test_without_token_skips(self):
        fake = FakeDiscord()
        for token in (None, "", "   "):
            out = io.StringIO()
            with mock.patch.dict(os.environ), \
                    mock.patch.object(mt, "discord_call", side_effect=fake), \
                    contextlib.redirect_stdout(out):
                os.environ.pop("DISCORD_BOT_TOKEN", None)
                if token is not None:
                    os.environ["DISCORD_BOT_TOKEN"] = token
                mt.cmd_discord_welcome(None, argparse.Namespace(dry_run=False))
            self.assertIn("übersprungen", out.getvalue(), repr(token))
        self.assertEqual(fake.calls, [])

    def test_existing_message_is_edited(self):
        fake = FakeDiscord(messages=[message("9", OTHER_AUTHOR_ID, "Hi"), old_welcome()],
                           screen={"description": OLD_SCREEN_DESCRIPTION, "welcome_channels": []})
        self.run_welcome(fake)
        edits = [c for c in fake.calls if c["method"] == "PATCH"
                 and c["path"] == f"/channels/{WELCOME_CHANNEL_ID}/messages/{OLD_WELCOME_ID}"]
        self.assertEqual(len(edits), 1)
        self.assertEqual(edits[0]["body"], mt.welcome_payload())
        self.assertNotIn("POST", [c["method"] for c in fake.calls])
        self.assertNotIn("PUT", [c["method"] for c in fake.calls])

    def test_old_screen_description_is_patched(self):
        fake = FakeDiscord(messages=[old_welcome()],
                           screen={"description": OLD_SCREEN_DESCRIPTION, "welcome_channels": []})
        self.run_welcome(fake)
        patches = [c for c in fake.calls
                   if c["method"] == "PATCH" and c["path"] == f"/guilds/{mt.DISCORD_GUILD_ID}/welcome-screen"]
        self.assertEqual(len(patches), 1)
        self.assertEqual(patches[0]["body"], {"description": mt.WELCOME_SCREEN_DESCRIPTION})

    def test_missing_screen_is_patched(self):
        fake = FakeDiscord(messages=[old_welcome()], screen=None)
        self.run_welcome(fake)
        self.assertIn(("PATCH", f"/guilds/{mt.DISCORD_GUILD_ID}/welcome-screen"), fake.writes())

    def test_welcome_screen_read_allows_404(self):
        fake = FakeDiscord(messages=[old_welcome()], screen=current_screen())
        self.run_welcome(fake)
        reads = [c for c in fake.calls
                 if c["method"] == "GET" and c["path"] == f"/guilds/{mt.DISCORD_GUILD_ID}/welcome-screen"]
        self.assertEqual(len(reads), 1)
        self.assertTrue(reads[0]["allow_404"])

    def test_no_message_posts_and_pins(self):
        fake = FakeDiscord(messages=[message("9", OTHER_AUTHOR_ID, mt.WELCOME_MESSAGE)],
                           screen=current_screen())
        self.run_welcome(fake)
        self.assertEqual(fake.writes(), [
            ("POST", f"/channels/{WELCOME_CHANNEL_ID}/messages"),
            ("PUT", f"/channels/{WELCOME_CHANNEL_ID}/pins/{NEW_WELCOME_ID}"),
        ])
        post = next(c for c in fake.calls if c["method"] == "POST")
        self.assertEqual(post["body"], mt.welcome_payload())

    def test_current_screen_not_patched(self):
        fake = FakeDiscord(messages=[old_welcome()], screen=current_screen())
        self.run_welcome(fake)
        self.assertNotIn(("PATCH", f"/guilds/{mt.DISCORD_GUILD_ID}/welcome-screen"), fake.writes())

    def test_reads_recent_messages_of_welcome_channel(self):
        fake = FakeDiscord(messages=[old_welcome()], screen=current_screen())
        self.run_welcome(fake)
        gets = [c["path"] for c in fake.calls if c["method"] == "GET"]
        self.assertIn("/users/@me", gets)
        self.assertIn(f"/guilds/{mt.DISCORD_GUILD_ID}/channels", gets)
        self.assertIn(f"/channels/{WELCOME_CHANNEL_ID}/messages?limit=50", gets)

    def test_all_calls_use_bot_token(self):
        fake = FakeDiscord(messages=[], screen=None)
        self.run_welcome(fake)
        self.assertTrue(fake.calls)
        self.assertEqual({c["token"] for c in fake.calls}, {FAKE_BOT_TOKEN})

    def test_dry_run_only_reads(self):
        for messages, screen in (([], None), ([old_welcome()], {"description": OLD_SCREEN_DESCRIPTION})):
            fake = FakeDiscord(messages=messages, screen=screen)
            out = self.run_welcome(fake, dry_run=True)
            self.assertEqual(fake.writes(), [])
            self.assertTrue(fake.calls)
            self.assertNotEqual(out.strip(), "")

    def test_missing_channel_exits(self):
        fake = FakeDiscord(channels=[{"id": NEWS_CHANNEL_ID, "name": "neuigkeiten", "type": 0}])
        with self.assertRaises(SystemExit) as cm:
            self.run_welcome(fake)
        self.assertNotIn(FAKE_BOT_TOKEN, exit_message(cm))
        self.assertEqual(fake.writes(), [])

    def test_output_never_contains_token(self):
        scenarios = (
            (dict(messages=[old_welcome()], screen={"description": OLD_SCREEN_DESCRIPTION}), False),
            (dict(messages=[], screen=None), False),
            (dict(messages=[old_welcome()], screen=current_screen()), False),
            (dict(messages=[], screen=None), True),
        )
        for kwargs, dry_run in scenarios:
            out = self.run_welcome(FakeDiscord(**kwargs), dry_run=dry_run)
            self.assertNotIn(FAKE_BOT_TOKEN, out)


class DiscordWelcomeCliTest(unittest.TestCase):
    def test_runs_without_taiga(self):
        argv = ["moach_taiga.py", "discord-welcome", "--dry-run"]
        with mock.patch.object(sys, "argv", argv), \
                mock.patch.object(mt, "Taiga", side_effect=AssertionError("Taiga not needed")), \
                mock.patch.object(mt, "detect_slug", side_effect=AssertionError("Taiga not needed")), \
                mock.patch.object(mt, "cmd_discord_welcome") as cmd:
            mt.main()
        cmd.assert_called_once()
        self.assertTrue(cmd.call_args.args[1].dry_run)


if __name__ == "__main__":
    unittest.main()
