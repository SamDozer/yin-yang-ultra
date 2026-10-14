# build_standalone.py - bundle modules, styles and font subsets into one offline file
import os
import re
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
MODULES = ['engine', 'tuning', 'hexagram', 'texts', 'journey', 'renderer', 'audio', 'app']


def read(name):
    with open(os.path.join(HERE, name), 'r', encoding='utf-8') as fh:
        return fh.read()


def strip_modules(src):
    src = re.sub(r'^import\s[\s\S]*?;\s*$', '', src, flags=re.MULTILINE)
    src = re.sub(r'^export\s+', '', src, flags=re.MULTILINE)
    return src


bundle = '(function () {\n\'use strict\';\n' + '\n'.join(
    '// --- %s ---\n%s' % (m, strip_modules(read(m + '.js'))) for m in MODULES
) + '\n})();\n'

body = re.search(r'<body[^>]*>([\s\S]*?)</body>', read('index.html')).group(1)
body = re.sub(r'<script\s+type="module"\s+src="app\.js"></script>', '', body)

css = read('fonts.css') + '\n' + read('style.css')

html = f'''<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#0b0a09">
  <meta name="description" content="رحلة تأمّلية في الين واليانج: من اللاقطب إلى العودة، مستندة إلى النصوص الكلاسيكية.">
  <title>الين واليانج — رحلة</title>
  <style>
{css}
  </style>
</head>
<body>
{body}
  <script>
{bundle}
  </script>
</body>
</html>
'''

with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as tmp:
    tmp.write(bundle)
check = subprocess.run(['node', '--check', tmp.name], capture_output=True, text=True)
os.remove(tmp.name)
if check.returncode != 0:
    sys.exit('Bundle failed syntax check (duplicate top-level names?):\n' + check.stderr)

with open(os.path.join(HERE, 'standalone.html'), 'w', encoding='utf-8') as fh:
    fh.write(html)
print('standalone.html built, %d KB' % (len(html.encode('utf-8')) // 1024))
