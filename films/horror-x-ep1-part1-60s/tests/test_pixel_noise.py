"""Do not mistake tiny raster rounding for changed SVG animation."""
import importlib.util
import unittest
from pathlib import Path
from PIL import Image

PATH = Path(__file__).resolve().parents[1]/'qa/compare-pixels.py'
spec = importlib.util.spec_from_file_location('pixels', PATH)
pixels = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pixels)


class RasterNoise(unittest.TestCase):
    def pair(self):
        a = Image.new('RGB',(20,20),(30,40,50))
        return a,a.copy()

    def test_identical_is_accepted(self):
        a,b=self.pair()
        self.assertEqual(pixels.compare(a,b)['changed_pixels'],0)
        self.assertTrue(pixels.compare(a,b)['accepted'])

    def test_two_one_level_pixels_are_accepted(self):
        a,b=self.pair()
        b.putpixel((2,3),(31,40,50)); b.putpixel((9,8),(30,39,50))
        result=pixels.compare(a,b)
        self.assertTrue(result['accepted'])
        self.assertEqual(result['changed_pixels'],2)
        self.assertEqual(result['max_channel_delta'],1)

    def test_visible_color_change_is_rejected(self):
        a,b=self.pair(); b.putpixel((2,3),(32,40,50))
        self.assertFalse(pixels.compare(a,b)['accepted'])

    def test_many_one_level_pixels_are_rejected(self):
        a,b=self.pair()
        for x in range(11): b.putpixel((x,0),(31,40,50))
        self.assertFalse(pixels.compare(a,b)['accepted'])

    def test_size_change_is_rejected(self):
        with self.assertRaises(ValueError):
            pixels.compare(Image.new('RGB',(2,2)),Image.new('RGB',(3,2)))


if __name__=='__main__': unittest.main()
