import glob
import json

page_files = glob.glob('BYDREAMY_FULL_BACKUP/other/**/pages/*.json', recursive=True)
pages = []
for pf in page_files:
    with open(pf, 'r', encoding='utf-8') as f:
        d = json.load(f)
    pages.append({
        'id': d['id'],
        'slug': d['slug'],
        'title': d['title']['rendered'],
        'date': d.get('date'),
        'content_len': len(d.get('content', {}).get('rendered', ''))
    })

pages.sort(key=lambda x: x['slug'])
for idx, p in enumerate(pages, 1):
    print(f"{idx:2}. ID: {p['id']:<8} Slug: {p['slug']:<32} Title: {p['title']}")
