# Unit tests for the pure Discord/Taiga helpers in moach_taiga.py.
# No network, no environment variables, no dates.
# Run: python3 -m unittest discover -s scripts -p 'test_*.py'
import importlib.util
import unittest
from pathlib import Path

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


if __name__ == "__main__":
    unittest.main()
