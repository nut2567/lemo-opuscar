"""Exercise the scheduler actually used to synthesize the soundtrack."""
import importlib.util
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('sound_design', ROOT / 'sound-design.py')
sound = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sound)


class CoinActionTiming(unittest.TestCase):
    def schedule(self, duration):
        scenes = [dict(id=sid, start=start, end=start+duration)
                  for sid, start in [('03',10), ('05',20), ('08',30)]]
        return {sid:(time,basis) for sid,time,basis
                in sound.coin_event_schedule(scenes)}

    def test_tray_contact_stays_at_local_keyframe_for_variable_durations(self):
        # Picture reaches REST_Y at u=1.6, independent of scene duration.
        for duration in [4.2518,5,5.9]:
            with self.subTest(duration=duration):
                self.assertAlmostEqual(self.schedule(duration)['05'][0],21.6)

    def test_slot_click_tracks_normalized_picture_flash(self):
        # Picture glint is p=.48, so a five-second shot clicks at u=2.4.
        self.assertAlmostEqual(self.schedule(5)['08'][0],32.4)
        self.assertAlmostEqual(self.schedule(4)['08'][0],31.92)

    def test_first_sort_landing_is_not_a_generic_scene_fraction(self):
        self.assertAlmostEqual(self.schedule(5)['03'][0],10.6324)
        self.assertAlmostEqual(self.schedule(4)['03'][0],10.6324)

    def test_rendered_cue_report_matches_production_scheduler(self):
        scenes = sound.load_timeline()[0]
        report = (ROOT/'SOUND-QA.md').read_text(encoding='utf-8')
        for sid,time,basis in sound.coin_event_schedule(scenes):
            found = re.search(r'\| coin_bounce \| '+sid+r' \| ([\d.]+)s',report)
            self.assertIsNotNone(found, sid)
            self.assertAlmostEqual(float(found[1]),time,places=3)
            self.assertTrue(basis)


if __name__ == '__main__':
    unittest.main()
