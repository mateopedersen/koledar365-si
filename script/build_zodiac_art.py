"""Original, resolution-independent zodiac portraits in the Koledar365 palette."""
from pathlib import Path
from math import sin, cos, pi

ROOT = Path(__file__).resolve().parents[1] / 'public/horoscope/art'
ROOT.mkdir(parents=True, exist_ok=True)

def p(d, fill='url(#stone)', stroke='#315b80', sw=1.5, extra=''):
    return f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round" {extra}/>'

def circle(x,y,r,fill='#173a60',extra=''):
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" {extra}/>'

DEFS = '''<defs>
<linearGradient id="stone" x1=".12" y1=".08" x2=".86" y2=".94"><stop stop-color="#fff"/><stop offset=".36" stop-color="#eff5fb"/><stop offset=".7" stop-color="#aec4d8"/><stop offset="1" stop-color="#3c668a"/></linearGradient>
<linearGradient id="dark" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#315c87"/><stop offset=".5" stop-color="#153b63"/><stop offset="1" stop-color="#081e38"/></linearGradient>
<linearGradient id="horn" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fcfdff"/><stop offset=".35" stop-color="#bdcfdf"/><stop offset=".7" stop-color="#5d7d9a"/><stop offset="1" stop-color="#dce6ee"/></linearGradient>
<linearGradient id="red" x2="1" y2="1"><stop stop-color="#d45a6b"/><stop offset="1" stop-color="#982a43"/></linearGradient>
<linearGradient id="water" x2=".6" y2="1"><stop stop-color="#81badb"/><stop offset="1" stop-color="#005da4"/></linearGradient>
<radialGradient id="halo"><stop stop-color="#fff"/><stop offset="1" stop-color="#e3edf6"/></radialGradient>
</defs>'''

def base():
    return '<circle cx="160" cy="156" r="128" fill="url(#halo)"/><circle cx="160" cy="156" r="116" fill="none" stroke="#c5d5e4" stroke-width=".6"/><path d="M39 102l37-40 41 12m138 130 29-42-13-35M45 224l27 24 26-9" fill="none" stroke="#c1d3e4" stroke-width=".8"/>' + ''.join(circle(x,y,r,'#789bbd') for x,y,r in [(39,102,2),(76,62,2.5),(117,74,1.6),(255,204,2.4),(284,162,1.8),(271,127,2),(45,224,1.7),(72,248,2),(98,239,1.6)]) + '<ellipse cx="163" cy="273" rx="83" ry="9" fill="#1a4166" opacity=".08"/>'

def eye(x,y):
    return p(f'M{x-10} {y}q10-8 20 0-10 9-20 0','#18334b','#294c6b',.8)+circle(x+1,y,3.1,'#092238')+circle(x+2,y-1,1,'#fff')

art = {}
# Ram: coiled horns, ears, wool planes, muzzle and individual facial markings.
ram=''
for mirror in ['', 'transform="translate(320 0) scale(-1 1)"']:
    ram+=f'<g {mirror}>'+p('M125 112C112 56 53 52 40 98c-12 41 17 67 43 56 25-11 19-42 2-45-14-3-20 10-13 19-20-2-19-31-2-40 24-13 43 7 47 37Z','url(#horn)')
    ram+=''.join(p(f'M{61+i*6} {72+i%3*3}q-19 30 4 58','none','#6d89a0',1,extra='opacity=".6"') for i in range(6))
    ram+=p('M118 132Q77 113 77 139q13 23 39 13','url(#stone)')+p('M107 139l-21-1 21 9','url(#dark)')+'</g>'
ram+=p('M116 119q-5 45 3 75l22 54q19 17 38 0l22-54q8-33 3-75-13-32-44-31-30-1-44 31Z')
ram+=''.join(p(f'M{118+i*12} {109+(i%2)*5}q8-13 17 0l-5 11','url(#stone)','#718da5',.8) for i in range(6))
ram+=p('M151 124l-11 61 11 21m17-82 14 61-13 21','none','#7591a9',1.2)+eye(135,159)+eye(185,159)
ram+=p('M139 212q21-14 42 0l-7 15-14 7-14-7Z','url(#horn)')+p('M150 216q10-6 20 0l-10 8Z','url(#dark)')+p('M160 226v13m-14 0q14 8 28 0','none','#183a59',1.4)
art['oven']=ram

# Bull with tapered horns, broad forehead, velvet nose and pronounced brow.
bull=''
for mirror in ['', 'transform="translate(320 0) scale(-1 1)"']:
    bull+=f'<g {mirror}>'+p('M119 117C65 114 35 75 44 39c11 33 43 47 75 48Z','url(#horn)')+p('M121 129Q63 104 61 131q16 23 55 20','url(#stone)')+p('M107 135l-31-8 25 16','url(#dark)')+'</g>'
bull+=p('M111 111q49-34 98 0l-7 67-18 61q-24 24-49 0l-17-61Z','url(#dark)')
bull+=p('M124 105q36-24 72 0l-13 45-23 17-24-18Z','url(#stone)')+p('M131 153l-12 14 18 2m52-16 12 14-18 2','none','#e3edf6',3)+eye(132,171)+eye(188,171)
bull+=p('M142 179q18-16 36 0l8 35h-52Z','url(#horn)')+p('M129 218q31-23 62 0l-5 24q-26 22-52 0Z','url(#stone)')
bull+=p('M139 224q-7-1-8 7 9 5 12-1m38-6q7-1 8 7-9 5-12-1','url(#dark)')+p('M145 244q15 5 30 0','none','#204566',2)+p('M140 110l20 20 20-20','none','#fff',1.8)
art['bik']=bull

def portrait(mirror=False, x=0):
    group=f'<g transform="translate({x} 0)'+(' translate(320 0) scale(-1 1)' if mirror else '')+'">'
    group+=p('M99 257q17-32 39-44l2-35 43-13-2 49q24 11 36 43Z')
    group+=p('M132 106q-5 41 5 61l20 21q21 2 31-19l4-21 13-7-13-13q-2-36-30-42-22-1-30 20Z')
    group+=p('M133 143q-30-12-17-50 13-33 48-28 30 0 36 31-10-4-18-2-13 13-34 14 1 24-15 35Z','url(#dark)')
    group+=''.join(p(f'M{122+i*7} 95q8-30 35-20','none','#7898b7',1.1) for i in range(5))
    group+=p('M177 121l12 2m-1 27 10-2m-20 16 12-2','none','#284965',1.4)+circle(183,126,1.6)
    group+=p('M134 216l22 18 27-20m-27 20v23','none','#557b9c',1.2)
    return group+'</g>'

art['dvojcka']='<path d="M60 224Q25 120 115 73m90 4q86 62 51 148" fill="none" stroke="#005da4" stroke-width="3"/>'+portrait(False,-50)+portrait(True,50)+p('M103 259q57-20 114 0','none','#b92f45',3)

# Anatomical crab: eight articulated legs and two large, separated claws.
crab=''
for mirror in ['', 'transform="translate(320 0) scale(-1 1)"']:
    crab+=f'<g {mirror}>'
    for i in range(4):
        y=164+i*16;crab+=p(f'M116 {y}L{75-i*6} {y+10} {51-i*3} {y+34}l20-16 49-5','url(#horn)','#315b80',1.1)
    crab+=p('M116 160q-27-8-37-32l-13-2 10-18 17 8q5 23 33 27Z','url(#stone)')
    crab+=p('M83 127q-50 0-44-41 0-24 27-31l-2 30 19 18 6-25q30 16 17 36Z','url(#stone)')
    crab+=p('M46 87l18 4 18 18m7-26 7 24','none','#7694ad',2)+'</g>'
crab+=p('M96 172q0-48 64-52 64 4 64 52l-17 44q-47 26-94 0Z','url(#dark)')
crab+=p('M109 161q12-35 51-34 39-1 51 34l-14 26q-37 17-74 0Z')
crab+=p('M127 151l33 14 33-14m-33 14v30','none','#7598b7',1.4)
crab+=p('M137 124l-4-16m50 16 4-16','none','#234c70',4)+circle(133,107,5)+circle(187,107,5)+circle(134,106,1.7,'#fff')+circle(188,106,1.7,'#fff')
art['rak']=crab

# Lion's mane uses individually shaded locks rather than a flat symbol.
lion=''
for i in range(18):
    a=i*2*pi/18; x=160+95*cos(a); y=154+109*sin(a)
    lion+=p(f'M160 151Q{x-27:.1f} {y-24:.1f} {x:.1f} {y:.1f}Q{x+23:.1f} {y+22:.1f} 160 151Z','url(#dark)','#315b80',1)
lion+=p('M111 110q-10-23 8-25 15-3 22 16m38 0q7-19 22-16 18 2 8 25','url(#horn)')
lion+=p('M115 115q45-30 90 0l-1 69-23 43h-42l-23-43Z')
lion+=p('M121 145l20-6 10 10m48-4-20-6-10 10','none','#153d61',4)+eye(138,153)+eye(182,153)
lion+=p('M153 151l-9 31 16 16 16-16-9-31','url(#horn)')
lion+=p('M132 191q14-15 28 1 14-16 28-1 8 26-28 30-36-4-28-30Z','#edf4fa')+p('M149 185q11-8 22 0l-11 12Z','url(#dark)')+p('M160 198v12m-13 0q13 7 26 0','none','#244865',1.3)
for mirror in ['', 'transform="translate(320 0) scale(-1 1)"']:
    lion+=f'<g {mirror}>'+p('M145 201l-40-6m41 12-43 2m45 4-37 10','none','#527b9d',.8)+'</g>'
art['lev']=lion

virgo=portrait(False,0)
virgo+=p('M118 109q-12 49 10 91l-10 36q-31-32-15-77-20-48 17-77','url(#dark)')
virgo+=''.join(p(f'M{108+i*4} 121q-9 40 11 78','none','#7b9ab7',1) for i in range(5))
virgo+=p('M211 260l26-99m-19 75 32-56m-27 33 3-48','none','#426f95',2)
for x,y in [(237,164),(232,180),(228,195),(250,181),(240,198),(231,215)]:
    virgo+=p(f'M{x} {y}q-14-15-3-22 10 7 3 22Z','url(#stone)','#52799b',1)
virgo+=p('M129 90q30-18 54 1','none','#b92f45',2)
art['devica']=virgo

libra=p('M149 91h22l5 144-16 17-16-17Z','url(#horn)')+p('M117 254q43-20 86 0v10h-86Z','url(#dark)')
libra+=p('M67 115q93-24 186 0l-3 9q-90-21-180 0Z','url(#stone)')+circle(160,106,12,'url(#red)')+circle(160,106,6,'#f9fbff')
for x in [79,241]:
    libra+=p(f'M{x} 119l-30 80m30-80 30 80','none','#4f7696',1.6)+p(f'M{x-37} 195h74q-8 32-37 32-29 0-37-32Z','url(#stone)')+p(f'M{x-28} 204q28 12 56 0','none','#89a5bd',1)
libra+=p('M153 134h14m-14 13h14m-13 63h12','none','#fff',2)
art['tehtnica']=libra

scorpion=''
for mirror in ['', 'transform="translate(320 0) scale(-1 1)"']:
    scorpion+=f'<g {mirror}>'
    for i in range(4):
        y=150+i*16;scorpion+=p(f'M137 {y}L{101-i*7} {y+10} {82-i*4} {y+36}','none','#315b80',4)
    scorpion+=p('M137 143l-33-35-19 1-10-22 17-11 21 20 38 33','url(#horn)')+p('M90 104q-40 6-42-23-4-19 17-30l2 24 16 8 5-24q23 12 15 31Z','url(#stone)')+'</g>'
scorpion+=p('M137 136q23-20 46 0l7 60q-30 32-60 0Z','url(#dark)')
for i in range(5):
    y=136+i*13;scorpion+=p(f'M138 {y}q22-10 44 0l3 11q-25 12-50 0Z','url(#stone)','#456e90',1)
scorpion+=p('M154 211q0 43 46 44 67-3 58-75-4-31-36-41','none','#244f76',21)
scorpion+=p('M154 211q0 43 46 44 67-3 58-75-4-31-36-41','none','#bfd0df',12)
for x,y in [(165,238),(187,251),(215,250),(239,232),(254,206),(254,180),(242,157)]:
    scorpion+=p(f'M{x-6} {y-7}l11 15','none','#42698b',2)
scorpion+=p('M226 144q-26-6-28-30 33 4 35 23l-13 5Z','url(#red)')
art['skorpijon']=scorpion

# Classical Sagittarius centaur with four distinct legs and a drawn bow.
centaur=p('M99 201l-19 62h14l22-46m65-14 18 59h14l-9-63','url(#dark)')
centaur+=p('M99 174q42-21 83 5l23 22-15 24-47-5-35-6-16 24-14-3 13-42Z')
centaur+=p('M186 181q24-10 33 9l6 18-12-2-11-15','none','#234b70',5)
centaur+=p('M108 178q-8-38 6-67l26-3 16 37 31 22-11 13-38-15-3 28Z')
centaur+=p('M119 113l-3-26 22-12 13 18-8 22Z')
centaur+=p('M112 91q-14-36 20-37 24 0 23 21l-18-1-6 21Z','url(#dark)')
centaur+=p('M131 121l41-14 49-22 5 10-45 31-38 14','url(#stone)')
centaur+=p('M123 128l-32-17 15-26 10 4-6 15 28 13','url(#horn)')
centaur+=p('M225 50q37 54 0 108m0-108v108','none','#17446e',3)+p('M102 91h146l-12-6m12 6-12 6','none','#b92f45',2.3)
centaur+=p('M99 222l-26 42h-13l27-50m55 5-9 45h13l16-43','url(#horn)')
centaur+=p('M116 171q16 12 27 11m-41-28 25 2','none','#7396b3',1.5)
art['strelec']=centaur

goat=''
for mirror in ['', 'transform="translate(320 0) scale(-1 1)"']:
    goat+=f'<g {mirror}>'+p('M135 119C127 68 78 19 71 43c18 7 29 40 35 78Z','url(#horn)')
    goat+=''.join(p(f'M{86+i*5} {57+i*9}l14-5','none','#577997',1.4) for i in range(6))
    goat+=p('M126 132q-32-24-49-3 14 25 43 18','url(#stone)')+'</g>'
goat+=p('M121 119q39-31 78 0l-9 74-22 46-8 25-11-26-22-45Z')
goat+=p('M134 136l-7 49 21 25m38-74 7 49-21 25','none','#7794aa',1.3)+eye(137,158)+eye(183,158)
goat+=p('M147 203l13-7 13 7-13 13Z','url(#dark)')+p('M150 228l10 20 11-20','url(#horn)')
goat+=p('M145 106l15 13 15-13','none','#fff',2)
art['kozorog']=goat

amphora='<g transform="rotate(27 155 143)">'
for mirror in ['', 'transform="translate(310 0) scale(-1 1)"']:
    amphora+=f'<g {mirror}>'+p('M124 105q-41-34-53-7-10 35 46 50l8-18q-37-9-36-25 5-12 34 15Z','url(#horn)')+'</g>'
amphora+=p('M125 74h61l-7 30q46 29 31 81-9 32-43 48l8 17h-48l9-17q-38-16-45-48-13-52 40-81Z')
amphora+=p('M120 72q35-11 70 0v9q-35 9-70 0Z','url(#dark)')
amphora+=p('M104 137q48 16 97 0m-103 14q54 16 108 0m-102 33q48 15 94 0','none','#507eaa',3)
amphora+=p('M130 164l11 8 11-8 11 8 11-8','none','#b92f45',3)+p('M133 102q-26 36-22 63','none','#fff',4)
amphora+='</g>'
amphora+=p('M192 61q42-8 53 25 13 44-20 92-13 20 8 35 32 22 8 49','none','url(#water)',15)+p('M199 64q35-2 38 27 6 36-22 81-20 34 8 54','none','#a4cee6',4)
art['vodnar']=amphora

def fish(transform):
    value=f'<g transform="{transform}">'
    value+=p('M84 149q47-56 112-14l31-25-1 47 2 45-34-32q-65 33-110-21Z')
    value+=p('M128 120q21-32 45-16l-7 24m-39 48q19 29 41 12l-3-17','url(#horn)')
    value+=p('M112 131q14 17 0 35','none','#436f94',1.5)+circle(99,145,4.5,'#112f50')+circle(100,143,1.6,'#fff')
    for i in range(4):
        for j in range(3):
            x=126+i*15;y=137+j*10
            value+=p(f'M{x} {y}q8 6 0 12','none','#739bbb',.7)
    value+=p('M199 147l20-22m-19 29 21-4m-21 12 22 26','none','#688dac',1)
    return value+'</g>'

art['ribi']=fish('translate(10 -12) rotate(-23 160 156)')+fish('translate(310 315) rotate(157 0 0) scale(.88)')

for slug,body in art.items():
    (ROOT/f'{slug}-v1.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 310" width="320" height="310"><title>{slug} · Koledar365</title>{DEFS}{base()}{body}</svg>\n')

glyphs=[
 'M-12 10V-3q-1-15-10-10-6 5 1 11m33 12V-3q1-15 10-10 6 5-1 11',
 'M-12-16q0 14 12 14t12-14M0-2a12 12 0 1 0 0 24 12 12 0 1 0 0-24',
 'M-14-16q14 7 28 0m-28 32q14-7 28 0M-8-13v26M8-13v26',
 'M-17-5q9-13 27-6m7 16q-9 13-27 6M-10-10a6 6 0 1 0 0 12 6 6 0 1 0 0-12m20 8a6 6 0 1 0 0 12 6 6 0 1 0 0-12',
 'M-9 2a8 8 0 1 0 0 16 8 8 0 1 0 0-16m4 0q-12-31 10-29 21 4 4 24-8 13 4 17',
 'M-20 12V-12q10-10 12 0v24m0-24q10-10 12 0v24m0-24q10-10 12 0v19q0 13-9 16m9-16 10-11',
 'M-20 15h40m-40-9h10q-7-8-2-16 12-14 24 0 5 8-2 16h10',
 'M-21 12V-12q10-10 12 0v24m0-24q10-10 12 0v24m0-24q10-10 12 0v23l13 8m-7-10 7 10-11 2',
 'M-15 16l31-32m-16 0h16V0m-31-1 16 16',
 'M-19-8q12-17 19 0l-3 21q4 17 16 9 14-10-3-20L0 10m-4-18 8 18',
 'M-21-5l8-7 9 8 9-8 10 8 7-8m-43 23 8-7 9 8 9-8 10 8 7-8',
 'M-13-19q16 19 0 38m26-38q-16 19 0 38M-21 0h42'
]
wheel='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500"><defs><radialGradient id="w"><stop stop-color="#fff"/><stop offset="1" stop-color="#e8f1f9"/></radialGradient></defs><circle cx="250" cy="250" r="226" fill="url(#w)"/><g fill="none" stroke="#b6cada"><circle cx="250" cy="250" r="210"/><circle cx="250" cy="250" r="192"/><circle cx="250" cy="250" r="136"/><circle cx="250" cy="250" r="123" stroke-dasharray="2 8"/></g>'
for i,glyph in enumerate(glyphs):
    a=(i*30-90)*pi/180
    x,y=250+164*cos(a),250+164*sin(a)
    wheel+=f'<g transform="translate({x:.2f} {y:.2f}) scale(.73)" fill="none" stroke="'+('#b92f45' if i%3==0 else '#1b527f')+f'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="{glyph}"/></g>'
    b=a+15*pi/180
    wheel+=f'<path d="M{250+137*cos(b):.2f} {250+137*sin(b):.2f}L{250+191*cos(b):.2f} {250+191*sin(b):.2f}" stroke="#b6cada" stroke-width=".7"/>'
wheel+='<path d="M250 145l14 77 77 28-77 14-14 77-14-77-77-14 77-28Z" fill="#e8f0f8" stroke="#547da3" stroke-width="1"/><circle cx="250" cy="250" r="49" fill="#fff" stroke="#cad9e6"/><text x="250" y="255" text-anchor="middle" fill="#20354b" font-family="Arial,sans-serif" font-size="37" font-weight="700">12</text><text x="250" y="273" text-anchor="middle" fill="#b92f45" font-family="Arial,sans-serif" font-size="8" font-weight="700" letter-spacing="2">ZNAMENJ</text><circle cx="250" cy="39" r="5" fill="#b92f45"/><circle cx="39" cy="250" r="4" fill="#005da4"/><circle cx="461" cy="250" r="4" fill="#005da4"/></svg>'
(ROOT/'wheel-hero-v1.svg').write_text(wheel+'\n')
icon='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><circle cx="32" cy="32" r="28" fill="#f1f6fc" stroke="#88a8c5" stroke-width="1.5"/><circle cx="32" cy="32" r="20" fill="#fff" stroke="#005da4" stroke-width="1.5"/><path d="M32 4v8m0 40v8M4 32h8m40 0h8M12 12l6 6m28 28 6 6m0-40-6 6M18 46l-6 6" stroke="#005da4" stroke-width="2"/><path d="M32 18l4 10 11 4-11 4-4 10-4-10-11-4 11-4Z" fill="#b92f45"/><circle cx="32" cy="32" r="3" fill="#fff"/></svg>'
(ROOT/'wheel-icon-v1.svg').write_text(icon+'\n')
print(f'Created {len(art)} individual zodiac portraits and two wheel assets.')
