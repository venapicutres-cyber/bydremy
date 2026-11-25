import glob
import json
import os
import re

page_files = glob.glob('BYDREAMY_FULL_BACKUP/other/**/pages/*.json', recursive=True)
post_css_files = glob.glob('BYDREAMY_FULL_BACKUP/css/**/post-*.css', recursive=True)

css_id_map = {}
for cf in post_css_files:
    fname = os.path.basename(cf)
    pid = fname.split('_')[0].replace('post-', '')
    css_id_map[pid] = cf

templates = []

for pf in page_files:
    with open(pf, 'r', encoding='utf-8') as f:
        d = json.load(f)
    pid = str(d['id'])
    slug = d['slug']
    title = d['title']['rendered']
    content = d.get('content', {}).get('rendered', '')
    
    # Read post css
    css_content = ''
    if pid in css_id_map:
        with open(css_id_map[pid], 'r', encoding='utf-8', errors='ignore') as f:
            css_content = f.read()
    
    # Find audio url if any
    audio_match = re.search(r'https?://[^\s"\'<>]+\.(?:mp3|ogg|wav)', content)
    audio_url = audio_match.group(0) if audio_match else ''
    if not audio_url:
        audio_match_css = re.search(r'https?://[^\s"\'<>]+\.(?:mp3|ogg|wav)', css_content)
        audio_url = audio_match_css.group(0) if audio_match_css else ''

    templates.append({
        'id': pid,
        'slug': slug,
        'title': title,
        'content_len': len(content),
        'css_len': len(css_content),
        'audio_url': audio_url
    })

print(f"Total templates processed: {len(templates)}")
for t in templates[:10]:
    print(f"{t['id']} | {t['slug']} | content: {t['content_len']} | css: {t['css_len']} | audio: {t['audio_url']}")
