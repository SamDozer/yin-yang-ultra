# Embed only the glyphs this project uses, as base64 woff2 in fonts.css.
import base64
import os
import sys

from fontTools import subset

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCES = ['texts.js', 'hexagram.js', 'journey.js', 'index.html', 'app.js', 'renderer.js']
FONTS = {
    'Ma Shan Zheng': os.path.join(ROOT, 'tools', 'fonts-src', 'MaShanZheng-Regular.ttf'),
    'Amiri': os.path.join(ROOT, 'tools', 'fonts-src', 'Amiri-Regular.ttf'),
}


def used_chars():
    chars = set()
    for name in SOURCES:
        with open(os.path.join(ROOT, name), encoding='utf-8') as fh:
            chars.update(c for c in fh.read() if ord(c) > 127)
    return chars


def is_cjk(c):
    return 0x2E80 <= ord(c) <= 0x9FFF or 0xF900 <= ord(c) <= 0xFAFF


def woff2_b64(path, text):
    opts = subset.Options()
    opts.flavor = 'woff2'
    opts.layout_features = ['*']
    font = subset.load_font(path, opts)
    sub = subset.Subsetter(opts)
    sub.populate(text=text)
    sub.subset(font)
    tmp = os.path.join(ROOT, 'tools', '_tmp.woff2')
    subset.save_font(font, tmp, opts)
    with open(tmp, 'rb') as fh:
        data = fh.read()
    os.remove(tmp)
    return base64.b64encode(data).decode('ascii')


def main():
    chars = used_chars()
    cjk = ''.join(sorted(c for c in chars if is_cjk(c)))
    other = ''.join(sorted(c for c in chars if not is_cjk(c))) + ' .,:;()-0123456789'
    rules = []
    for family, text in (('Ma Shan Zheng', cjk), ('Amiri', other)):
        b64 = woff2_b64(FONTS[family], text)
        rules.append(
            "@font-face{font-family:'%s';src:url(data:font/woff2;base64,%s) format('woff2');"
            "font-display:swap}" % (family, b64)
        )
        print('%s: %d glyph chars, %.1f KB' % (family, len(text), len(b64) * 3 / 4 / 1024))
    with open(os.path.join(ROOT, 'fonts.css'), 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(rules) + '\n')


if __name__ == '__main__':
    sys.exit(main())
