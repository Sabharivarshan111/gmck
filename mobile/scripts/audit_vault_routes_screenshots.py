"""Pair real mobile Vercel and installed Android Vault route screenshots."""
import json
import sys
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
folder = Path(sys.argv[1])
names = ['home','notes-years','notes-subjects','notes-anatomy-topics','proforma-library','proforma-guide','proforma-clerk','proforma-viva','pg-bank','pg-exam-information','flashcard-hub','flashcard-written','flashcard-study','flashcard-answer','flashcard-scheduled','simulator-studio']
pairs = []
for name in names:
    web, native = folder / ('vault-vercel-' + name + '.png'), folder / ('vault-android-' + name + '.png')
    pair = {'id': name, 'capturedBoth': web.exists() and native.exists(), 'visuallyReviewed': False}
    if pair['capturedBoth']:
        with Image.open(web) as a, Image.open(native) as b:
            a, b = ImageOps.exif_transpose(a).convert('RGB'), ImageOps.exif_transpose(b).convert('RGB')
            pair['dimensions'] = {'vercel': list(a.size), 'android': list(b.size)}
            a.thumbnail((393,852)); b.thumbnail((393,852))
            canvas = Image.new('RGB', (800,920), '#171821')
            canvas.paste(a,(0,35)); canvas.paste(b,(406,35))
            draw = ImageDraw.Draw(canvas)
            draw.text((8,10), 'VERCEL MOBILE - ' + name, fill='white')
            draw.text((414,10), 'INSTALLED ANDROID - ' + name, fill='white')
            draw.text((8,900), 'Actual platform screenshots; visual review required. NOT CERTIFIED.', fill='#ff9a9a')
            canvas.save(folder / ('comparison-vault-' + name + '.png'))
    pairs.append(pair)
(folder / 'vault-route-visual-audit.json').write_text(json.dumps({'status':'NOT_CERTIFIED','pairs':pairs},indent=2))
if not all(item['capturedBoth'] for item in pairs):
    raise SystemExit('Incomplete Vault route screenshot pairs')
