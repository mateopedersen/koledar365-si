from pathlib import Path
from xml.sax.saxutils import escape
import json,math
D=Path('public/topics');D.mkdir(exist_ok=True)
configs=json.loads(Path('data/topic_experiences_sl.json').read_text())['pages']
def rect(x,y,w,h,fill,rx=10,stroke='none'):
 return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}"/>'
def text(x,y,t,size=22,fill='#133653',weight=800):return f'<text x="{x}" y="{y}" font-family="Avenir,system-ui,sans-serif" font-size="{size}" font-weight="{weight}" fill="{fill}">{escape(str(t))}</text>'
def calendar(x,y,year='2027',scale=1):
 s=rect(0,0,190,190,'url(#paper)',16,'#b9cfe0')+rect(0,0,190,48,'#005da4',16)+rect(0,27,190,21,'#005da4',0)+text(26,33,year,24,'#fff')
 s+='<path d="M36-8V14M153-8V14" stroke="#173f61" stroke-width="9" stroke-linecap="round"/>'
 for row in range(3):
  for col in range(4):s+=rect(23+col*39,70+row*35,27,24,'#cf314b' if (row,col)==(1,2) else '#d5e5f2',5)
 s+='<path d="m105 117 5 5 10-11" fill="none" stroke="#fff" stroke-width="3"/>'
 return f'<g transform="translate({x} {y}) scale({scale})" filter="url(#shadow)">{s}</g>'
def book(x,y,fill='#005da4',angle=-7):
 return f'<g transform="translate({x} {y}) rotate({angle})" filter="url(#shadow)">'+rect(0,0,130,175,fill,8)+rect(8,7,118,161,'url(#paper)',5)+rect(0,0,14,175,fill,5)+rect(24,24,78,8,'#d7e5f0',3)+rect(24,43,56,6,'#d7e5f0',3)+rect(24,64,72,5,'#d7e5f0',3)+'</g>'
def pencil(x,y,angle=20):
 return f'<g transform="translate({x} {y}) rotate({angle})" filter="url(#shadow)"><path d="M0 0h18v173l-9 25-9-25z" fill="url(#red)"/><path d="M0 173h18l-9 25z" fill="#dfc6a2"/><path d="m6 190 3 8 3-8" fill="#17334e"/>'+rect(0,0,18,17,'#cedbe4',2)+'<path d="M6 23v145" stroke="#fff" stroke-opacity=".45" stroke-width="3"/></g>'
def globe(x,y,r=55):
 return f'<g transform="translate({x} {y})"><circle r="{r}" fill="url(#earth)"/><path d="M-35-15-19-37 5-35 11-18 29-12 19 7 5 3-8 27-26 13-22-1z" fill="#7da99e"/><ellipse rx="{r*.5}" ry="{r}" fill="none" stroke="#b7d8e8" stroke-opacity=".6"/><path d="M-{r} 0H{r}M-40-30h80M-40 30h80" stroke="#b7d8e8" stroke-opacity=".5"/><circle r="{r}" fill="url(#shade)"/></g>'
def cap(x,y):return f'<g transform="translate({x} {y})" filter="url(#shadow)"><path d="m0 0 87-36 88 36-88 38z" fill="url(#blue)"/><path d="M33 16v35q53 29 108 0V16l-54 22z" fill="#103e65"/><path d="m87 0 63 15v58" fill="none" stroke="#d42d48" stroke-width="5"/><circle cx="150" cy="78" r="7" fill="#c92e49"/><path d="M146 83v19m8-19v19" stroke="#c92e49" stroke-width="4"/></g>'
def star(x,y,r=2):return f'<circle cx="{x}" cy="{y}" r="{r}" fill="#d4eafa"/>'
def draw(kind):
 defs='<defs><linearGradient id="paper" x2=".7" y2="1"><stop stop-color="#fff"/><stop offset="1" stop-color="#e7f0f7"/></linearGradient><linearGradient id="blue" x2="1" y2="1"><stop stop-color="#2c81ba"/><stop offset="1" stop-color="#073f70"/></linearGradient><linearGradient id="red" x2="1" y2="0"><stop stop-color="#9f203d"/><stop offset=".4" stop-color="#ed5066"/><stop offset="1" stop-color="#b72642"/></linearGradient><radialGradient id="earth" cx=".3" cy=".3"><stop stop-color="#6eb4d5"/><stop offset="1" stop-color="#07558d"/></radialGradient><radialGradient id="shade" cx=".25" cy=".25"><stop offset=".35" stop-color="#102b4a" stop-opacity="0"/><stop offset="1" stop-color="#071b35" stop-opacity=".6"/></radialGradient><radialGradient id="sun"><stop stop-color="#fff4c9"/><stop offset=".75" stop-color="#ffc562"/><stop offset="1" stop-color="#e68b36"/></radialGradient><radialGradient id="moon" cx=".25" cy=".25"><stop stop-color="#f6f0e6"/><stop offset="1" stop-color="#8295a7"/></radialGradient><radialGradient id="blood" cx=".3" cy=".3"><stop stop-color="#e89564"/><stop offset=".65" stop-color="#b14d41"/><stop offset="1" stop-color="#3a273d"/></radialGradient><linearGradient id="sky" x2=".5" y2="1"><stop stop-color="#071d38"/><stop offset="1" stop-color="#155c87"/></linearGradient><linearGradient id="leaf" x2="1" y2="1"><stop stop-color="#9bc35f"/><stop offset="1" stop-color="#336e46"/></linearGradient><filter id="shadow" x="-.3" y="-.3" width="1.8" height="1.8"><feDropShadow dx="0" dy="9" stdDeviation="8" flood-color="#15344c" flood-opacity=".16"/></filter></defs>'
 s=rect(1,1,518,358,'#eff5fb',28,'#d1e0ec')+'<circle cx="332" cy="157" r="139" fill="#e2eef7"/><circle cx="332" cy="157" r="120" fill="none" stroke="#c7dbe9" stroke-dasharray="3 9"/>'
 s+='<ellipse cx="264" cy="316" rx="198" ry="14" fill="#143e63" opacity=".09"/>'
 if kind=='school':
  s+=calendar(290,99,'2026/27',.95)+book(76,112,'#cf314b')
  s+='<g filter="url(#shadow)"><path d="M172 151v-26q0-41 42-41t42 41v26" fill="none" stroke="#15486d" stroke-width="12"/>'+rect(147,121,135,177,'url(#blue)',28)+rect(161,203,108,74,'#e9f2f9',15,'#bcd1e1')+'<path d="M180 218h68M214 128v48" stroke="#9cbfd8" stroke-width="5" stroke-linecap="round"/>'+rect(202,143,25,20,'#c8334c',4)+'</g>'
 elif kind in ['matura','general','vocational']:
  s+=book(89,119,'#c6314a',-10)+calendar(294,124,'2027',.78)+cap(164,92)
  if kind=='matura':s+=text(202,252,'MATURA',22)+text(210,283,'2027',33,'#005da4')
  if kind=='general':s+=pencil(250,138,23)+text(115,203,'Esej',25,'#005da4')
  if kind=='vocational':
   s+='<g transform="translate(211 235)" filter="url(#shadow)"><path d="M-45-36-25-50-8-32 13-33 26-50 48-34 40-13 50 5 70 10 68 36 44 40 34 57 10 55 0 34-20 29-41 40-58 21-48 2-50-17z" fill="url(#blue)"/><circle r="23" fill="#edf5fa"/><circle r="13" fill="#bdcfe0"/></g>'+pencil(373,86,20)
 elif kind in ['npz','npz3','npz6','npz9']:
  if kind=='npz':
   for x,y,a,c in [(68,116,'3.','#005da4'),(216,87,'6.','#0d406a'),(363,125,'9.','#c6314a')]:s+=book(x,y,c,-5)+text(x+40,y+119,a,42,c)
  else:
   s+=book(81,98,'#c8314a',-8)+text(122,221,kind[-1]+'.',52,'#005da4')+calendar(297,106,'NPZ 2027',.85)+pencil(272,115,22)
   if kind=='npz6':s+=globe(349,269,43)
   elif kind=='npz9':s+='<path d="m326 270 112-65-9 103z" fill="#cadce9" stroke="#719ab9" stroke-width="3"/><path d="m355 272 49-28-4 43z" fill="#f3f8fc"/>'
   else:s+=rect(280,260,41,41,'url(#blue)',6)+rect(330,260,41,41,'url(#red)',6)+text(291,289,'+',25,'#fff')+text(341,289,'=',25,'#fff')
 elif kind=='study':
  s+='<g filter="url(#shadow)"><path d="m74 150 140-87 140 87z" fill="url(#blue)"/>'+rect(86,151,256,141,'url(#paper)',3,'#becfe0')
  for x in [108,170,232,294]:s+=rect(x,168,19,99,'#b5ccdf',2)+rect(x-4,161,27,8,'#fff',2)+rect(x-4,263,27,9,'#a5bfd3',2)
  s+=rect(70,284,291,14,'#1b4f77',3)+text(178,135,'UNIVERZA',18,'#fff')+'</g>'+calendar(328,117,'2026/27',.73)+book(219,207,'#c6314a',80)
 elif kind in ['pension','social']:
  s+=calendar(284,75,'2026',.95)+rect(75,131,260,164,'url(#paper)',21,'#b7cee0')+rect(75,131,260,49,'url(#blue)',21)+rect(75,158,260,22,'url(#blue)',0)
  s+=rect(100,203,35,28,'#d9c492',5)+rect(101,248,109,7,'#a6bfd3',3)+rect(102,262,76,6,'#d0dfea',3)
  if kind=='pension':s+=text(244,166,'ZPIZ',24,'#fff')+'<circle cx="274" cy="238" r="26" fill="#e5f0f7"/><path d="m260 238 10 10 21-24" fill="none" stroke="#005da4" stroke-width="6" stroke-linecap="round"/>'
  else:
   s+=text(241,166,'CSD',24,'#fff')
   for x,y,r in [(220,217,16),(267,214,18),(246,251,12)]:s+=f'<circle cx="{x}" cy="{y}" r="{r}" fill="#6c91ae"/>'+f'<path d="M{x-r-5} {y+r+17}q0-28 {r+5}-28t{r+5} 28" fill="'+('#c6334a' if r==12 else '#005da4')+'"/>'
 elif kind=='garden':
  s+='<path d="M38 249q212-36 444 0v49H38z" fill="#715947"/><path d="M38 250q212-36 444 0" stroke="#bda078" stroke-width="7" fill="none"/>'
  for x,n in [(96,0),(251,1),(411,2)]:
   if n==0:s+='<g transform="translate(96 246) rotate(-24)"><ellipse rx="13" ry="8" fill="#ad8a59"/><path d="M-8 0H8" stroke="#d8c18e"/></g>'
   else:
    h=66 if n==1 else 132
    s+=f'<path d="M{x} 246v-{h}" stroke="#40724c" stroke-width="7" fill="none" stroke-linecap="round"/>'
    for side,y in [(-1,245-h+16),(1,245-h+42),(-1,245-h+65)][:2 if n==1 else 3]:s+=f'<path d="M{x} {y}q{side*58}-1 {side*48}-39q{-side*52}-14 {-side*48} 39" fill="url(#leaf)"/>'
    s+=f'<path d="M{x} 249v41m0-31-21 17m21-6 20 13" stroke="#dfc9a7" stroke-width="3" fill="none"/>'
  s+='<path d="M139 207h48m-10-8 10 8-10 8M295 179h48m-10-8 10 8-10 8" stroke="#005da4" stroke-width="3" fill="none"/>'
 elif kind in ['solar','lunar','perseids']:
  s=rect(1,1,518,358,'url(#sky)',28,'#173e61')
  for i in range(43):s+=star(18+(i*83)%480,23+(i*47)%276,1+(i%3)*.45)
  if kind=='perseids':
   s+='<path d="m0 294 76-73 44 36 83-100 59 71 50-41 78 82 47-27 83 58v60H0z" fill="#163d59"/><path d="m171 194 32-37 31 38-27-14-17 17z" fill="#bfd7e7"/><path d="m0 320 133-53 103 39 102-54 182 72v36H0z" fill="#071e32"/>'
   for x,y,l in [(291,48,121),(431,86,97),(185,85,81),(382,157,72)]:s+=f'<path d="m{x} {y} {-l} {l*.72}" stroke="#edf8ff" stroke-width="2.5" stroke-linecap="round"/><circle cx="{x-l}" cy="{y+l*.72}" r="3.4" fill="#fff"/>'
   s+='<path d="M63 112 99 66 153 48 196 81" fill="none" stroke="#77a5c6" stroke-width="1.2" stroke-dasharray="4 5"/>'
  else:
   s+='<circle cx="86" cy="180" r="55" fill="url(#sun)"/><circle cx="86" cy="180" r="64" fill="none" stroke="#ffd58a" stroke-opacity=".35" stroke-width="8"/>'
   if kind=='solar':s+='<path d="m235 160 206 39-206 2z" fill="#0b1527" opacity=".75"/><path d="m235 158 219-67v184l-219-74z" fill="#b9d3e9" opacity=".09"/><circle cx="234" cy="180" r="22" fill="url(#moon)"/>'+globe(423,180,48)
   else:s+='<path d="m259 134 240 44-240 48z" fill="#040f20" opacity=".7"/><path d="m259 132 240-37v170l-240-37z" fill="#8ba8ca" opacity=".12"/>'+globe(257,180,46)+'<circle cx="433" cy="180" r="25" fill="url(#blood)"/>'
   # Craters remain identifiable at phone sizes without using a raster photograph.
   mx,my=(234,180) if kind=='solar' else (433,180)
   for dx,dy,r in [(-7,-6,4),(8,7,6),(3,-11,3)]:s+=f'<circle cx="{mx+dx}" cy="{my+dy}" r="{r}" fill="#596779" opacity=".27"/>'
   s+=text(57,276,'Sonce',19,'#eef7ff')+text(205 if kind=='solar' else 226,276,'Luna' if kind=='solar' else 'Zemlja',19,'#eef7ff')+text(393 if kind=='solar' else 410,276,'Zemlja' if kind=='solar' else 'Luna',19,'#eef7ff')
 return defs+s
for path,p in configs.items():
 kind=p['art'];body=draw(kind);svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="520" height="360" viewBox="0 0 520 360" role="img" aria-labelledby="title desc"><title id="title">{escape(p["artAlt"])}</title><desc id="desc">{escape(p["artCaption"])}</desc>{body}</svg>\n';(D/f'{kind}.svg').write_text(svg)
print('Created',len(configs),'original SVG illustrations')
