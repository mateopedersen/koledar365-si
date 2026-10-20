# Independent file-level verification. Run after the Ruby export matrix.
import json,hashlib,zipfile
from pathlib import Path
from PIL import Image,ImageChops
from pypdf import PdfReader
root=Path(__file__).resolve().parent.parent
matrix=json.loads((root/'evidence/export-matrix-v2.json').read_text())
rows=[]
for row in matrix['results']:
    if row['status']!='passed': rows.append({'type':row['type'],'design':row['design'],'errors':[row.get('error')]});continue
    folder=root/row['folder'];m=json.loads((folder/'manifest.json').read_text());errors=[]
    pdf=PdfReader(folder/m['pdf_filename'])
    if len(pdf.pages)!=m['page_count']:errors.append('PDF page count')
    for i,page in enumerate(pdf.pages):
        if abs(float(page.mediabox.width)-595.27559)>0.1 or abs(float(page.mediabox.height)-841.88976)>0.1:errors.append('A4 PDF dimensions')
        text=page.extract_text()
        if 'Koledar365 · koledar365.si' not in text:errors.append('Missing brand on PDF page '+str(i+1))
        fonts=page.get('/Resources',{}).get('/Font',{})
        for font in fonts.values():
            f=font.get_object();descriptor=f.get('/FontDescriptor')
            if descriptor and not any(k in descriptor.get_object() for k in ['/FontFile','/FontFile2','/FontFile3']):errors.append('Unembedded font')
        record=m['pages'][i];file=folder/record['filename']
        with Image.open(file) as im:
            if im.size!=(4961,7016):errors.append('Wrong 600 ppi pixel dimensions')
            if not im.info.get('icc_profile'):errors.append('Missing sRGB profile')
            if record['color_mode']=='monochrome_bw':
                r,g,b=im.convert('RGB').split()
                if ImageChops.difference(r,g).getbbox() or ImageChops.difference(r,b).getbbox():errors.append('Chromatic pixels in BW')
    rows.append({'type':row['type'],'design':row['design'],'pages':len(pdf.pages),'errors':errors})
report={'version':matrix['version'],'completed':len(rows),'expected':180,'failures':[r for r in rows if r['errors']],'rows':rows}
(root/'evidence/export-file-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({'completed':len(rows),'failures':len(report['failures'])}))
