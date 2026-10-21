#!/usr/bin/env python3
"""Exact SVG astronomy diagrams and responsive WebP assets, without network.

This is schematic vector artwork, not a simulated observation or a star map.
Requires Pillow and Inkscape. Local open DejaVu Sans is used for rasterization;
the website inherits its own Avenir typography around these illustrations.
"""
from pathlib import Path
import html
import io
import json
import math
import random
import subprocess
import tempfile
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
DEST = ROOT / 'public/images/astronomy'
BLUE, RED, INK, PALE = '#005da4', '#c52d45', '#153650', '#f2f7fc'

def text(x, y, value, size=26, fill=INK, weight=400, anchor='start'):
    return f'<text x="{x}" y="{y}" font-size="{size}" fill="{fill}" font-weight="{weight}" text-anchor="{anchor}">{html.escape(value)}</text>'

def begin(width, height, title, desc):
    return [f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-labelledby="title desc"><title id="title">{html.escape(title)}</title><desc id="desc">{html.escape(desc)}</desc>',
            '<defs><radialGradient id="sun"><stop stop-color="#fff"/><stop offset="1" stop-color="#e5f1fb"/></radialGradient><radialGradient id="earth" cx="30%" cy="30%"><stop stop-color="#2d83bd"/><stop offset="1" stop-color="#064873"/></radialGradient><radialGradient id="moon" cx="30%" cy="30%"><stop stop-color="#e5edf5"/><stop offset="1" stop-color="#a4b7c9"/></radialGradient></defs>',
            f'<rect width="{width}" height="{height}" fill="{PALE}"/><rect x="0" y="0" width="{width}" height="8" fill="{BLUE}"/><rect x="0" y="0" width="{int(width*.15)}" height="8" fill="{RED}"/><g font-family="DejaVu Sans, Liberation Sans, sans-serif">']

def finish(parts, width, height, mobile=False):
    parts.append(text(width-38, height-27, 'koledar365.si', 24 if mobile else 18, fill='#536d85', anchor='end'))
    parts.append('</g></svg>')
    return '\n'.join(parts)

def moon_phase(cx,cy,r,phase):
    s=[f'<circle cx="{cx}" cy="{cy}" r="{r+10}" fill="none" stroke="#d5e3ee" stroke-width="1.5"/>',f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{INK}" stroke="#2b536f" stroke-width="2"/>']
    if phase=='full':
        s.append(f'<circle cx="{cx}" cy="{cy}" r="{r-1}" fill="#fff"/>')
    elif phase=='first':
        s.append(f'<path d="M {cx} {cy-r+1} A {r-1} {r-1} 0 0 1 {cx} {cy+r-1} Z" fill="#fff"/>')
    elif phase=='last':
        s.append(f'<path d="M {cx} {cy-r+1} A {r-1} {r-1} 0 0 0 {cx} {cy+r-1} Z" fill="#fff"/>')
    return ''.join(s)

def phases(mobile):
    w,h=(640,780) if mobile else (1200,630)
    p=begin(w,h,'Štiri glavne Lunine mene','Mlaj, prvi krajec, polna luna in zadnji krajec. Shematski pogled s severne poloble.')
    p.extend([text(38 if mobile else 54,75,'Lunine mene',42 if mobile else 46,weight=750),text(38 if mobile else 54,119,'En cikel, štirje glavni trenutki',25 if mobile else 24,fill='#526f87')])
    names=[('Mlaj','new','01'),('Prvi krajec','first','02'),('Polna luna','full','03'),('Zadnji krajec','last','04')]
    for i,(label,phase,number) in enumerate(names):
        x=(170 if i%2==0 else 470) if mobile else 155+i*296
        y=(262 if i<2 else 530) if mobile else 310
        r=73 if mobile else 78
        p.append(moon_phase(x,y,r,phase))
        p.append(text(x,y+r+50,label,28 if mobile else 28,weight=750,anchor='middle'))
        if not mobile:
            p.append(text(x,y+r+85,number,16,fill='#8497a9',anchor='middle'))
            if i<3:p.append(f'<path d="M {x+110} {y} h 65 m -9 -6 l 9 6 -9 6" fill="none" stroke="#7a9bb7" stroke-width="2"/>')
    p.append(text(38 if mobile else 54,h-76,'Osvetljeni del Lune · severna polobla',24 if mobile else 21,fill='#526f87'))
    return finish(p,w,h,mobile)

def earth(cx,cy,r):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#earth)" stroke="#005da4" stroke-width="2"/><ellipse cx="{cx}" cy="{cy}" rx="{r*.42}" ry="{r}" fill="none" stroke="#b2d6ed" stroke-width="1.2" opacity=".55"/><ellipse cx="{cx}" cy="{cy}" rx="{r}" ry="{r*.36}" fill="none" stroke="#b2d6ed" stroke-width="1.2" opacity=".55"/><path d="M {cx-r} {cy} H {cx+r}" stroke="#b2d6ed" stroke-width="1.2" opacity=".55"/>'

def eclipse(solar,mobile):
    w,h=(640,780) if mobile else (1200,630)
    title='Sončev mrk' if solar else 'Lunin mrk'
    desc='Luna med Soncem in Zemljo' if solar else 'Zemlja med Soncem in Luno'
    p=begin(w,h,title,desc+'. Velikosti in razdalje niso v merilu.')
    left=38 if mobile else 54
    p.extend([text(left,75,title,42 if mobile else 46,weight=750),text(left,119,desc,25 if mobile else 24,fill='#526f87')])
    y=300 if mobile else 315
    if solar:
        sx,sr,mx,mr,ex,er=(100,64,398,23,548,49) if mobile else (160,100,760,34,1030,72)
        tip=mx+mr*(mx-sx)/(sr-mr)
        pen=mr+(w-mx)*(sr+mr)/(mx-sx)
        p.extend([f'<path d="M {mx} {y-mr} L {w} {y-pen} L {w} {y+pen} L {mx} {y+mr} Z" fill="#c7d7e6" opacity=".5"/>',f'<path d="M {mx} {y-mr} L {tip} {y} L {mx} {y+mr} Z" fill="#254a68" opacity=".45"/>'])
        p.append(f'<path d="M {sx} {y-sr} L {mx} {y-mr} M {sx} {y+sr} L {mx} {y+mr}" fill="none" stroke="#a5c6df" stroke-width="1.5" stroke-dasharray="6 6"/>')
        p.append(earth(ex,y,er))
        p.append(f'<circle cx="{mx}" cy="{y}" r="{mr}" fill="url(#moon)" stroke="#6e879d" stroke-width="1.5"/>')
        p.extend([text(mx,y+mr+43,'Luna',27 if mobile else 28,weight=700,anchor='middle'),text(ex,y+er+44,'Zemlja',27 if mobile else 28,weight=700,anchor='middle')])
    else:
        sx,sr,ex,er,mx,mr=(98,64,330,43,540,24) if mobile else (160,100,640,70,1020,35)
        tip=ex+er*(ex-sx)/(sr-er)
        end=w
        half=max(0,er-(end-ex)*(sr-er)/(ex-sx))
        p.extend([f'<path d="M {ex} {y-er} L {end} {y-half} L {end} {y+half} L {ex} {y+er} Z" fill="#173d5b" opacity=".8"/>',f'<path d="M {sx} {y-sr} L {ex} {y-er} M {sx} {y+sr} L {ex} {y+er}" fill="none" stroke="#a5c6df" stroke-width="1.5" stroke-dasharray="6 6"/>'])
        p.append(earth(ex,y,er))
        p.append(f'<circle cx="{mx}" cy="{y}" r="{mr}" fill="#a94a55" stroke="#d1979d" stroke-width="1.5"/>')
        p.extend([text(ex,y+er+44,'Zemlja',27 if mobile else 28,weight=700,anchor='middle'),text(mx,y+mr+43,'Luna',27 if mobile else 28,weight=700,anchor='middle')])
        if not mobile:p.append(text(852,220,'Zemljina senca',22,fill='#4b647c',anchor='middle'))
    p.append(f'<circle cx="{sx}" cy="{y}" r="{sr+9}" fill="none" stroke="#c7deed" stroke-width="2"/><circle cx="{sx}" cy="{y}" r="{sr}" fill="url(#sun)" stroke="#81b6dc" stroke-width="2"/>')
    p.append(text(sx,y+sr+44,'Sonce',27 if mobile else 28,weight=700,anchor='middle'))
    if mobile:
        p.append(f'<rect x="38" y="464" width="564" height="208" rx="12" fill="#fff" stroke="#cbdeec"/>')
        if solar:
            p.append('<circle cx="144" cy="564" r="63" fill="#e4f1fb" stroke="#7aadd0" stroke-width="2"/><circle cx="171" cy="541" r="59" fill="#153650"/>')
            p.extend([text(242,529,'Luna zakrije',27,weight=700),text(242,566,'del Sonca ali',27,weight=700),text(242,603,'vse Sonce.',27,weight=700)])
        else:
            p.append('<circle cx="144" cy="564" r="63" fill="#a94a55" stroke="#7d3443" stroke-width="2"/>')
            p.extend([text(242,529,'Luna prehaja',27,weight=700),text(242,566,'skozi Zemljino',27,weight=700),text(242,603,'senco.',27,weight=700)])
        p.append(text(38,714,'Shema · ni v merilu',24,fill='#526f87'))
    else:
        p.append(text(54,545,'Vidnost je odvisna od poravnave in položaja opazovalca.',23,fill='#3e617e'))
        p.append(text(54,590,'Velikosti in razdalje niso v merilu.',18,fill='#647d94'))
    return finish(p,w,h,mobile)

def perseids(mobile):
    w,h=(640,820) if mobile else (1200,630)
    p=begin(w,h,'Perzeidi: opazovanje temnega neba','Shematske sledi meteorjev navidezno izhajajo iz radianta v Perzeju. To ni zvezdna karta za določen čas ali kraj.')
    left=38 if mobile else 54
    p.extend([text(left,75,'Perzeidi',42 if mobile else 46,weight=750),text(left,119,'Pod temno avgustovsko nebo',25 if mobile else 24,fill='#526f87')])
    top,bottom=158,(666 if mobile else 535)
    p.append(f'<defs><clipPath id="sky"><rect x="{left}" y="{top}" width="{w-2*left}" height="{bottom-top}" rx="12"/></clipPath></defs><rect x="{left}" y="{top}" width="{w-2*left}" height="{bottom-top}" rx="12" fill="#08395f"/><g clip-path="url(#sky)">')
    rng=random.Random(365)
    for _ in range(90):
        x=rng.uniform(left+10,w-left-10); y=rng.uniform(top+12,bottom-12)
        p.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{rng.uniform(.6,1.5):.1f}" fill="#d7e8f6" opacity="{rng.uniform(.3,.9):.2f}"/>')
    rx,ry=(459,295) if mobile else (902,280)
    for angle,length,start in [(152,420,180),(176,510,220),(211,350,130),(130,470,200),(101,300,130),(28,260,130),(-42,250,100),(-122,280,140)]:
        angle=math.radians(angle)
        x1,y1=rx+math.cos(angle)*start,ry+math.sin(angle)*start
        x2,y2=rx+math.cos(angle)*length,ry+math.sin(angle)*length
        p.append(f'<path d="M {rx} {ry} L {x1:.1f} {y1:.1f}" stroke="#b5cfe2" opacity=".22" stroke-dasharray="4 8" fill="none"/>')
        p.append(f'<path d="M {x1:.1f} {y1:.1f} L {x2:.1f} {y2:.1f}" stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none"/>')
        p.append(f'<circle cx="{x2:.1f}" cy="{y2:.1f}" r="3" fill="#fff"/>')
    p.append(f'<circle cx="{rx}" cy="{ry}" r="17" fill="none" stroke="#f07588" stroke-width="2"/><circle cx="{rx}" cy="{ry}" r="4" fill="#ffb1bc"/>')
    p.append('</g>')
    if mobile:
        p.extend(['<rect x="55" y="176" width="360" height="57" rx="6" fill="#08395f" opacity=".94"/><rect x="55" y="576" width="520" height="60" rx="6" fill="#08395f" opacity=".94"/>',text(68,214,'Radiant v Perzeju',27,fill='#fff',weight=700),f'<path d="M 335 234 L {rx-12} {ry-20}" stroke="#f07588" stroke-width="2" fill="none"/>',text(68,613,'Opazujte širok del neba.',26,fill='#fff'),text(38,711,'Shema sledi · ni zvezdna karta',24,fill='#526f87')])
    else:
        p.extend([text(78,215,'Opazujte širok del neba.',27,fill='#fff',weight=700),text(901,226,'Radiant v Perzeju',23,fill='#fff',anchor='middle'),text(54,580,'Temno nebo in manj mesečine izboljšata opazovalne razmere.',23,fill='#3e617e')])
    return finish(p,w,h,mobile)

def render(stem, source, mobile):
    path=DEST/f'{stem}{"-mobile" if mobile else ""}.svg'
    path.write_text(source,encoding='utf-8')
    with tempfile.TemporaryDirectory() as tmp:
        png=Path(tmp)/'render.png'
        subprocess.run(['inkscape',str(path),'--export-type=png',f'--export-filename={png}','--export-width=640' if mobile else '--export-width=1200'],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
        image=Image.open(png).convert('RGB')
        if mobile:
            image.save(DEST/f'{stem}-mobile.webp',format='WEBP',quality=93,method=6)
        else:
            image.save(DEST/f'{stem}-1200.webp',format='WEBP',quality=93,method=6)
            image.resize((640,336),Image.Resampling.LANCZOS).save(DEST/f'{stem}-640.webp',format='WEBP',quality=90,method=6)

def main():
    DEST.mkdir(parents=True,exist_ok=True)
    specs=[('lunine-mene-slovenija',phases,'Štiri glavne Lunine mene: mlaj, prvi krajec, polna luna in zadnji krajec.'),('soncni-mrk-slovenija',lambda m:eclipse(True,m),'Shema Sončevega mrka: Luna med Soncem in Zemljo.'),('lunin-mrk-slovenija',lambda m:eclipse(False,m),'Shema Luninega mrka: Luna v Zemljini senci.'),('perzeidi-opazovanje-slovenija',perseids,'Shematske sledi Perzeidov z radiantem v Perzeju.')]
    registry=[]
    for stem,draw,alt in specs:
        render(stem,draw(False),False);render(stem,draw(True),True)
        registry.append({'stem':stem,'path':f'/images/astronomy/{stem}-1200.webp','width':1200,'height':630,'alt':alt,'mobile':f'/images/astronomy/{stem}-mobile.webp','creator':'Koledar365','caption':'Shematski prikaz. Velikosti in razdalje niso v merilu.' if 'mrk' in stem else 'Shematski prikaz za razlago pojava.'})
    (ROOT/'data/astronomy/images.json').write_text(json.dumps(registry,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    for file in sorted(DEST.glob('*.webp')):
        with Image.open(file) as im:print(f'{file.name}: {im.width}×{im.height}, {file.stat().st_size} bytes')

if __name__=='__main__':main()
