import sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import numpy as np
from importlib import import_module
mix_arrays=import_module('mix-audio').mix_arrays

class MixBehavior(unittest.TestCase):
    def test_dry_voice_is_present_dominant_and_not_clipped(self):
        t=np.arange(4800)/48000
        voice=np.repeat((.25*np.sin(2*np.pi*1000*t))[:,None],2,axis=1)
        score=np.repeat((.3*np.sin(2*np.pi*100*t))[:,None],2,axis=1)
        mixed,report=mix_arrays(voice,score)
        self.assertEqual(mixed.shape,voice.shape)
        self.assertGreater(np.corrcoef(mixed[:,0],voice[:,0])[0,1],.97)
        self.assertGreater(report['voice_to_score_db'],14)
        self.assertLessEqual(np.max(np.abs(mixed)),.9)
    def test_silent_or_missing_voice_cannot_pass_as_complete_soundtrack(self):
        with self.assertRaises(ValueError):mix_arrays(np.zeros((100,2)),np.ones((100,2)))
        with self.assertRaises(ValueError):mix_arrays(np.ones((100,2)),np.ones((99,2)))
    def test_score_silence_still_preserves_the_dry_voice_waveform(self):
        voice=np.array([[.1,.1],[-.2,-.2],[.3,.3]],dtype=float)
        mixed,_=mix_arrays(voice,np.zeros_like(voice))
        self.assertTrue(np.allclose(mixed/np.max(np.abs(mixed)),voice/.3))
if __name__=='__main__':unittest.main()
