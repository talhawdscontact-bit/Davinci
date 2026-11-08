"""Turn original photos into the site's WebP crops and switch their slots on.
Usage: python3 prepare_photos.py <folder of originals> <site folder>
Each original is named by its slot, e.g. home-hero.jpg, p-olive-leccino-1.jpg.
Crops use the slot's focal point (fx/fxm in js/photos.js)."""
import sys, re, json, pathlib
from PIL import Image, ImageOps
src, site = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
man = (site / 'js/photos.js').read_text()
out = site / 'img'; out.mkdir(exist_ok=True)
def focal(key, which):
    m = re.search(r"'" + re.escape(key) + r"':\s*\{([^}]*)\}", man)
    f = re.search(which + r":\s*'(\d+)% (\d+)%'", m.group(1)) if m else None
    return (int(f.group(1)) / 100, int(f.group(2)) / 100) if f else (.5, .5)
def crop(im, ratio, fx, fy):
    w, h = im.size
    if w / h > ratio: nw = int(h * ratio); x = min(max(int(fx * w - nw / 2), 0), w - nw); return im.crop((x, 0, x + nw, h))
    nh = int(w / ratio); y = min(max(int(fy * h - nh / 2), 0), h - nh); return im.crop((0, y, w, y + nh))
# Images keep their own proportions; the page crops them with each slot's focal point (fx / fxm in js/photos.js).
# Only heroes get a separate 4:5 phone crop, cut around fxm.
done = []
for f in sorted(src.iterdir()):
    if f.suffix.lower() not in ('.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff'): continue
    key = f.stem; im = ImageOps.exif_transpose(Image.open(f)).convert('RGB')
    hero = key.endswith('-hero')
    ratio = im.width / im.height
    for w in ((800, 1600, 2400) if hero else (600, 1200)):
        im.resize((w, round(w / ratio)), Image.LANCZOS).save(out / f'{key}-{w}.webp', quality=78, method=6)
    if hero:
        mob = crop(im, 4 / 5, *focal(key, 'fxm'))
        for w in (600, 1200): mob.resize((w, round(w * 5 / 4)), Image.LANCZOS).save(out / f'{key}-m-{w}.webp', quality=78, method=6)
    if min(im.size) < 1200: print('warning: small original', f.name, im.size)
    done.append(key)
ready = re.search(r"ready: \{(.*?)\},", man, re.S).group(1)
have = set(re.findall(r"'([\w-]+)'", ready)) | set(done)
man = re.sub(r"ready: \{.*?\},", 'ready: {' + ', '.join(f"'{k}': 1" for k in sorted(have)) + '},', man, count=1, flags=re.S)
(site / 'js/photos.js').write_text(man)
print('prepared', len(done), 'slots:', ', '.join(done))
