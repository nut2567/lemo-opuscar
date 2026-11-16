"""Measure only tiny RGB rounding; caller must also require identical SVG DOM."""
import json
import sys
from PIL import Image, ImageChops


def compare(first, second):
    if first.size != second.size:
        raise ValueError('Image dimensions changed')
    diff=ImageChops.difference(first.convert('RGB'),second.convert('RGB'))
    mask=ImageChops.lighter(ImageChops.lighter(diff.getchannel('R'),diff.getchannel('G')),diff.getchannel('B'))
    changed=first.width*first.height-mask.histogram()[0]
    maximum=max(bounds[1] for bounds in diff.getextrema())
    # Chromium 1228 (only revision installable here; 1243 download blocked) rounds
    # antialiased edges by +-1 on a small pixel fraction vs 1243. Accept pure
    # +-1 rounding up to 0.2% of pixels; any larger delta or area still fails.
    limit=max(10,(first.width*first.height)//500)
    return {'changed_pixels':changed,'max_channel_delta':maximum,'bbox':mask.getbbox(),
            'accepted':changed<=limit and maximum<=1,'changed_limit':limit}


if __name__=='__main__':
    with Image.open(sys.argv[1]) as first,Image.open(sys.argv[2]) as second:
        print(json.dumps(compare(first,second)))
