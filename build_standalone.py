# build_standalone.py
import re
import os

scratch_dir = os.path.dirname(os.path.abspath(__file__))

def read_file(name):
    with open(os.path.join(scratch_dir, name), 'r', encoding='utf-8') as f:
        return f.read()

css = read_file('style.css')
engine = read_file('engine.js')
audio = read_file('audio.js')
motion = read_file('motion.js')
renderer = read_file('renderer.js')
app = read_file('app.js')
index = read_file('index.html')

def clean_js(content):
    # 1. Remove all import statements (single-line or multi-line)
    content = re.sub(r'import\b[\s\S]*?;\s*', '', content)
    
    # 2. Remove export statements
    content = re.sub(r'^\s*export\s+default\s+', '', content, flags=re.MULTILINE)
    content = re.sub(r'^\s*export\s+(const|let|var|function|class)\s+', r'\1 ', content, flags=re.MULTILINE)
    content = re.sub(r'^\s*export\s*\{[^}]*\};?\s*', '', content, flags=re.MULTILINE)
    return content

clean_engine = clean_js(engine)
clean_audio = clean_js(audio)
clean_motion = clean_js(motion)
clean_renderer = clean_js(renderer)
clean_app = clean_js(app)

bundled_js = f"""(function() {{
  'use strict';

  // --- ENGINE ---
{clean_engine}

  // --- AUDIO ---
{clean_audio}

  // --- MOTION ---
{clean_motion}

  // --- RENDERER ---
{clean_renderer}

  // --- APP ---
{clean_app}
}})();"""

# Extract body from index.html (excluding <script type="module" src="app.js"></script>)
body_match = re.search(r'<body[^>]*>(.*?)</body>', index, re.DOTALL)
if body_match:
    body_content = body_match.group(1)
    body_content = re.sub(r'<script\s+type="module"\s+src="app\.js"></script>', '', body_content)
else:
    raise RuntimeError("Could not find body in index.html")

standalone_html = f"""<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#05070f">
  <meta name="description" content="تجربة كونية بصرية وتفاعلية فائقة لتكوّن الين واليانج وحفظ الطاقة والتوازن في الوجود.">
  <title>الوجود — التجربة الكونية الفائقة للين واليانج</title>
  <style>
{css}
  </style>
</head>
<body>
{body_content}
  <script>
{bundled_js}
  </script>
</body>
</html>
"""

with open(os.path.join(scratch_dir, 'standalone.html'), 'w', encoding='utf-8') as f:
    f.write(standalone_html)

print("standalone.html built successfully! Size:", len(standalone_html), "bytes")
