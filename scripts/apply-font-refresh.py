from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import urllib.request, re, time

root = Path(__file__).resolve().parents[1]
headers = {'Referer': 'https://www.alibabafonts.com/', 'User-Agent': 'Mozilla/5.0'}
def fetch(url):
    for attempt in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=20) as response:
                return response.read()
        except Exception:
            if attempt == 2: raise
            time.sleep(1)

styles = []
jobs = []
for variant, name, weight in [('regular', 'AlibabaPuHuiTi-2-55-Regular', 400), ('bold', 'AlibabaPuHuiTi-2-85-Bold', 700)]:
    base = f'https://fonts.alibabadesign.com/AlibabaPuHuiTi-2/{name}/'
    css = fetch(base + name + '.css').decode('utf-8')
    directory = root / 'public/fonts/puhuiti' / variant
    directory.mkdir(parents=True, exist_ok=True)
    files = set(re.findall(r'[\w-]+\.woff2', css))
    if not files: raise RuntimeError('No font files found')
    jobs.extend((base + file, directory / file) for file in files)
    css = re.sub(r'font-family\s*:[^;}]+', "font-family:'Alibaba PuHuiTi'", css)
    css = re.sub(r'font-weight\s*:[^;}]+', f'font-weight:{weight}', css)
    css = re.sub(r'url\([^)]*?([\w-]+\.woff2)[^)]*\)', lambda m: f"url('/fonts/puhuiti/{variant}/{m[1]}')", css)
    styles.append(css)
    print(f'{variant}: {len(files)} font subsets', flush=True)

def download(job):
    url, path = job
    data = path.read_bytes() if path.exists() else fetch(url)
    if data[:4] != b'wOF2': raise RuntimeError(f'Invalid font: {path.name}')
    path.write_bytes(data)
with ThreadPoolExecutor(max_workers=12) as pool:
    for i, _ in enumerate(pool.map(download, jobs), 1):
        if i % 25 == 0: print(f'Downloaded {i}/{len(jobs)}', flush=True)
(root / 'src/puhuiti.css').write_text('\n'.join(styles), encoding='utf-8')

path = root / 'src/main.js'
text = path.read_text(encoding='utf-8')
text = text.replace("import './composer-layout.css';", "import './puhuiti.css';\nimport './composer-layout.css';")
text = text.replace("import { partDisplayName } from './part-names.js';", "import { partDisplayName, partDisplayNumber } from './part-names.js';")
start = text.index('function buildPartLists()')
before, after = text[:start], text[start:]
after = after.replace('for(const part of parts)', 'for(const part of [...parts].sort((a,b)=>Number(partDisplayNumber(a.userData.partId))-Number(partDisplayNumber(b.userData.partId))))', 1)
after = after.replace("number.textContent=id.replace('part-','').padStart(2,'0')", 'number.textContent=partDisplayNumber(id)', 1)
path.write_text(before + after, encoding='utf-8')

path = root / 'src/part-names.js'
text = path.read_text(encoding='utf-8')
marker = 'export function partDisplayName(id)'
addition = """export const DISPLAY_PART_ORDER = Object.freeze([
  ...Object.keys(PRINTED_PART_NAMES),
  'part-1', 'part-4', 'part-8', 'part-13', 'part-14', 'part-15', 'part-16', 'part-27'
]);
export function partDisplayNumber(id) {
  const index = DISPLAY_PART_ORDER.indexOf(id);
  if (index < 0) throw new Error(`Missing part number: ${id}`);
  return String(index + 1).padStart(2, '0');
}
"""
text = text.replace(marker, addition + marker)
text = re.sub(r"id\.replace\('part-',\s*''\)\.padStart\(2,\s*'0'\)", 'partDisplayNumber(id)', text)
path.write_text(text, encoding='utf-8')

path = root / 'src/composer-layout.css'
text = path.read_text(encoding='utf-8')
text += """
/* Shared typography and compact viewer actions. */
html:lang(zh), html:lang(zh-CN) {
  font-family: 'Alibaba PuHuiTi', 'Manrope', 'Microsoft YaHei', sans-serif;
  font-weight: 400;
}
.parts-heading h3, #explore-panel .slider-label, .part-columns h4,
#lesson-steps button[aria-current=step],
#lesson-connections > button[aria-pressed=true],
.language-switch button[aria-pressed=true], .bom-header h2 { font-weight: 700; }
.view-actions { gap: 28.8px; }
.view-actions button { min-height: 52.8px; padding: 12px 4.8px; font-size: clamp(16.8px, 1.14vw, 20.4px); }
@media (max-width: 800px) {
  .view-actions { gap: 19.2px; }
  .view-actions button { min-height: 48px; padding: 9.6px 0; font-size: 15.6px; }
}
"""
path.write_text(text, encoding='utf-8')
print('Applied global font, button sizing, and display numbering.', flush=True)
