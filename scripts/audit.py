import glob
import json
import re
import os

page_files = glob.glob('BYDREAMY_FULL_BACKUP/other/**/pages/*.json', recursive=True)
print(f'Total pages found: {len(page_files)}')

pages_info = []
all_external_urls = set()
all_local_matched = set()

with open('BYDREAMY_FULL_BACKUP/manifest.json', 'r', encoding='utf-8') as f:
    manifest = json.load(f)

# build url to local file map
url_to_file = {}
for item in manifest['files']:
    url_to_file[item['url']] = item['file']
    url_to_file[item['final_url']] = item['file']
    # also normalized url without protocol
    clean_url = item['url'].replace('https://bydreamy.com/', '').replace('http://bydreamy.com/', '').replace('https://bydreamy.com/', '')
    url_to_file[clean_url] = item['file']

for pf in page_files:
    with open(pf, 'r', encoding='utf-8') as f:
        d = json.load(f)
    content = d.get('content', {}).get('rendered', '')
    title = d.get('title', {}).get('rendered', '')
    slug = d.get('slug', '')
    pid = d.get('id')
    
    # find images and asset URLs
    urls = re.findall(r'(?:src|href|url)\s*=\s*[\'"]([^\'"]+)[\'"]', content)
    bg_urls = re.findall(r'url\([\'"]?([^\'\"\)]+)[\'"]?\)', content)
    all_urls = set(urls + bg_urls)
    
    matched = 0
    missing = 0
    for u in all_urls:
        if 'bydreamy.com' in u or 'bydreamy.com' in u or u.startswith('/'):
            norm_u = u.replace('https://bydreamy.com/', '').replace('https://bydreamy.com/', '').lstrip('/')
            if u in url_to_file or norm_u in url_to_file:
                matched += 1
            else:
                missing += 1
                all_external_urls.add(u)
    
    pages_info.append({
        'id': pid,
        'slug': slug,
        'title': title,
        'content_len': len(content),
        'total_assets_found': len(all_urls),
        'matched_local': matched,
        'missing_local': missing
    })

pages_info.sort(key=lambda x: x['slug'])
print("=" * 100)
print(f"{'ID':<8} | {'Slug':<35} | {'Length':<8} | {'Matched':<7} | {'Missing':<7} | {'Title'}")
print("-" * 100)
for p in pages_info:
    print(f"{p['id']:<8} | {p['slug']:<35} | {p['content_len']:<8} | {p['matched_local']:<7} | {p['missing_local']:<7} | {p['title']}")
print("=" * 100)
print(f"Total missing distinct asset URLs across all pages: {len(all_external_urls)}")
print("Sample missing URLs (first 10):", list(all_external_urls)[:10])
