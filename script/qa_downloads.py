#!/usr/bin/env python3
"""Independently parse every catalog download and linked PDF/WebP/ZIP/ICS file.

Requires Pillow and pypdf. Full image decoding is deliberate. Reports distinguish
structural validation from the optional 780-pair raster comparison.
"""
import calendar, csv, datetime, hashlib, io, json, os, re, subprocess, tempfile, zipfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import urlsplit, unquote
from PIL import Image, ImageChops, ImageStat
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'site'
OUT = Path(os.environ.get('QA_OUT', ROOT / 'evidence/qa/downloads'))
OUT.mkdir(parents=True, exist_ok=True)
CATALOG = json.loads((SITE / 'free/catalog.json').read_text())
MONTHS = ['januar','februar','marec','april','maj','junij','julij','avgust','september','oktober','november','december']
files = {}
previous = {}
if os.environ.get('QA_REUSE_REPORT') == '1' and (OUT/'download-test-report.csv').exists():
    with (OUT/'download-test-report.csv').open() as f:
        previous = {row['url']:row for row in csv.DictReader(f)}
for entry in CATALOG:
    for kind in ['pdf', 'webp']:
        files[entry['files'][kind]] = (kind, entry)
    if entry.get('legacy_webp_url'): files[entry['legacy_webp_url']] = ('zip', None)
for html in SITE.rglob('*.html'):
    if '/free/' in str(html): continue
    for href in re.findall(r'href=[\"\']([^\"\']+)', html.read_text()):
        u = urlsplit(href)
        if u.netloc and u.netloc != 'koledar365.si': continue
        if u.path.startswith('/') and Path(u.path).suffix.lower() in ['.pdf','.webp','.zip','.ics','.xlsx']:
            files.setdefault(unquote(u.path), (Path(u.path).suffix[1:], None))

def check(item):
    url, (kind, entry) = item
    row = dict(url=url, kind=kind, catalog=bool(entry), collection=entry.get('collection','') if entry else '', passed=False, bytes=0, pages='', dimensions='', sha256='', errors='')
    try:
        p = SITE / url.lstrip('/')
        data = p.read_bytes()
        assert len(data)>30, 'Empty or implausibly short file'
        row['bytes'] = len(data); row['sha256'] = hashlib.sha256(data).hexdigest()
        prior=previous.get(url)
        if prior and prior['passed']=='True' and prior['sha256']==row['sha256']:
            # Reuse a completed full parse only after proving the current bytes
            # are identical. CI defaults to a fresh parse of every file.
            return {**row,'passed':True,'pages':prior['pages'],'dimensions':prior['dimensions']}
        meta = entry['manifest'] if entry else {}
        if data.startswith(b'%PDF-'):
            reader=PdfReader(io.BytesIO(data), strict=True)
            assert not reader.is_encrypted, 'Encrypted PDF'
            row['pages']=len(reader.pages)
            assert row['pages']>0
            if entry: assert row['pages']==entry['page_count'], 'PDF page count'
            texts=[]
            for i,page in enumerate(reader.pages):
                width,height=float(page.mediabox.width),float(page.mediabox.height)
                assert width>100 and height>100
                if entry:
                    page_meta=meta['pages'][i]
                    assert abs(width*25.4/72-page_meta['width_mm'])<1 and abs(height*25.4/72-page_meta['height_mm'])<1, 'Paper dimensions'
                texts.append(page.extract_text() or '')
            row['dimensions']=f'{width:.2f}x{height:.2f} pt'
            if meta.get('pdf_sha256'): assert row['sha256']==meta['pdf_sha256'], 'PDF hash'
            if entry and entry.get('collection'):
                text=' '.join(texts).casefold(); year=entry['options']['year']; month=entry['options']['month']
                # Stacked numerals and the original design's three overprinted
                # year layers are both real PDF text. Require whole year units;
                # a different year or a year embedded in other digits fails.
                year_pattern=r'\s*'.join(str(year))
                assert re.search(r'(?<!\d)(?:'+year_pattern+r'){1,3}(?!\d)', text), 'Wrong or absent year in PDF text'
                months=[month] if entry['options']['type']=='monthly' else list(range(1,13))
                for m in months: assert MONTHS[m-1] in text, 'Month absent in PDF text'
                expected=[datetime.date(year,m,d).isoformat() for m in months for d in range(1,calendar.monthrange(year,m)[1]+1)]
                assert meta['primary_dates']==expected, 'Manifest dates differ from independent calendar'
        elif data[:4]==b'RIFF' and data[8:12]==b'WEBP':
            with Image.open(io.BytesIO(data)) as im:
                im.load(); row['dimensions']=f'{im.width}x{im.height} px'
                assert im.width>0 and im.height>0
                if entry:
                    page_meta=meta['pages'][0]
                    assert im.size==(page_meta['width_px'],page_meta['height_px']), 'WebP dimensions'
                    assert row['sha256']==page_meta['sha256'], 'WebP hash'
                    for pixels,mm in zip(im.size,[page_meta['width_mm'],page_meta['height_mm']]):
                        assert abs(pixels/mm*25.4-600)<1, 'WebP is not 600 ppi at documented paper size'
        elif data.startswith(b'PK'):
            with zipfile.ZipFile(io.BytesIO(data)) as archive:
                assert archive.testzip() is None, 'ZIP CRC failure'
                images=[x for x in archive.namelist() if x.endswith('.webp')]
                if kind=='xlsx': assert 'xl/workbook.xml' in archive.namelist()
                else:
                    assert images, 'ZIP contains no WebP pages'
                    row['pages']=len(images)
                    if entry: assert len(images)==entry['page_count'], 'WebP ZIP page count'
                    for i,name in enumerate(images):
                        image_data=archive.read(name)
                        with Image.open(io.BytesIO(image_data)) as im:
                            im.load()
                            if entry:
                                page_meta=next(x for x in meta['pages'] if x['filename']==Path(name).name)
                                assert im.size==(page_meta['width_px'],page_meta['height_px'])
                                assert hashlib.sha256(image_data).hexdigest()==page_meta['sha256']
        elif kind=='ics':
            text=data.decode('utf-8'); assert 'BEGIN:VCALENDAR' in text and 'END:VCALENDAR' in text
        else: raise AssertionError('File format signature does not match a supported download')
        row['passed']=True
    except Exception as e: row['errors']=f'{type(e).__name__}: {e}'
    return row

rows=[]
with ThreadPoolExecutor(max_workers=int(os.environ.get('QA_WORKERS','2'))) as pool:
    for row in pool.map(check, sorted(files.items())):
        rows.append(row)
        if len(rows)%250==0: print(f'{len(rows)}/{len(files)} files, {sum(not x["passed"] for x in rows)} failed',flush=True)
with (OUT/'download-test-report.csv').open('w') as f:
    writer=csv.DictWriter(f,fieldnames=list(rows[0])); writer.writeheader();writer.writerows(rows)
summary={'checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'files':len(rows),'passed':sum(x['passed'] for x in rows),'failed':sum(not x['passed'] for x in rows),'catalog_pairs':len(CATALOG),'collection_pairs':sum(bool(x.get('collection')) for x in CATALOG),'failed_rows':[x for x in rows if not x['passed']]}
(OUT/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps({k:v for k,v in summary.items() if k!='failed_rows'}),flush=True)
for row in summary['failed_rows']: print(json.dumps(row,ensure_ascii=False),flush=True)
raise SystemExit(bool(summary['failed']))
