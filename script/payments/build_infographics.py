#!/usr/bin/env python3
"""Exact SVG and WebP payment graphics drawn from the reviewed source JSON.

No dates are calculated from a last-business-day rule. Pillow only rasterizes
this newly authored diagram; the underlying data also drives the HTML table.
"""
import html
import json
from datetime import date
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[2]
DATA=json.loads((ROOT/'public/payments/data.json').read_text())
OUT=ROOT/'public/images/payments'
OUT.mkdir(parents=True,exist_ok=True)
WIDTH,HEIGHT=1440,900
BLUE,INK,MUTED,RED='#0054b8','#18314f','#647991','#c5253e'
MONTHS=['Januar','Februar','Marec','April','Maj','Junij','Julij','Avgust','September','Oktober','November','December']
DAYS=['ponedeljek','torek','sreda','četrtek','petek','sobota','nedelja']
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

class Drawing:
    def __init__(self,title):
        self.im=Image.new('RGB',(WIDTH,HEIGHT),'#f7f9fc');self.draw=ImageDraw.Draw(self.im)
        self.svg=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{WIDTH}" height="{HEIGHT}" viewBox="0 0 {WIDTH} {HEIGHT}" role="img"><title>{html.escape(title)}</title><rect width="1440" height="900" fill="#f7f9fc"/>']
    def rect(self,x,y,w,h,fill,r=0,stroke=None):
        self.draw.rounded_rectangle((x,y,x+w,y+h),radius=r,fill=fill,outline=stroke,width=2)
        self.svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}"'+(f' stroke="{stroke}" stroke-width="2"' if stroke else '')+'/>')
    def text(self,x,y,value,size=18,fill=INK,bold=False,anchor='left'):
        font=ImageFont.truetype(BOLD if bold else FONT,size)
        self.draw.text((x,y),value,font=font,fill=fill,anchor={'left':'ls','center':'ms','right':'rs'}[anchor])
        self.svg.append(f'<text x="{x}" y="{y}" font-family="DejaVu Sans, sans-serif" font-size="{size}" font-weight="{700 if bold else 400}" fill="{fill}" text-anchor="'+{'left':'start','center':'middle','right':'end'}[anchor]+'">'+html.escape(value)+'</text>')
    def save(self,stem):
        self.svg.append('</svg>');(OUT/f'{stem}.svg').write_text('\n'.join(self.svg)+'\n')
        self.im.save(OUT/f'{stem}.webp','WEBP',quality=90,method=6)
        print(stem, (OUT/f'{stem}.webp').stat().st_size)

canvas=Drawing('Koledar izplačil pokojnin 2026 po uradnih datumih ZPIZ')
canvas.rect(0,0,WIDTH,212,'#12385e');canvas.rect(0,0,480,6,'#ffffff');canvas.rect(480,0,480,6,BLUE);canvas.rect(960,0,480,6,RED)
canvas.text(65,54,'KOLEDAR365 / OBJAVLJENI DATUMI',17,'#bed2e9',True)
canvas.text(65,123,'Izplačila pokojnin',49,'#ffffff',True)
canvas.text(65,165,'Redna mesečna izplačila v Sloveniji',20,'#d7e3f0')
canvas.text(1370,142,'2026',82,'#ffffff',True,'right')
events=sorted([event for event in DATA['events'] if event['source_id']=='zpiz'],key=lambda event:event['plan_month'])
assert len(events)==12
for index,event in enumerate(events):
    day=date.fromisoformat(event['date']);x=65+(index%4)*331;y=245+(index//4)*184
    special=day.month==12
    canvas.rect(x,y,310,162,'#fff3f5' if special else '#ffffff',12,'#e9bac3' if special else '#dce5ee')
    canvas.text(x+22,y+34,MONTHS[day.month-1].upper(),15,RED if special else MUTED,True)
    canvas.text(x+22,y+91,f'{day.day}. {day.month}. 2026',31,RED if special else BLUE,True)
    canvas.text(x+22,y+126,DAYS[day.weekday()],17,MUTED)
canvas.text(65,849,'Vir: ZPIZ · Podatki preverjeni 21. 10. 2026',17,MUTED)
canvas.text(1374,849,'koledar365.si/izplacila-pokojnin/',17,BLUE,True,'right')
canvas.save('pokojnine-2026')

canvas=Drawing('Izbrani socialni transferji: oktober, november in december 2026')
canvas.rect(0,0,480,6,'#ffffff');canvas.rect(480,0,480,6,BLUE);canvas.rect(960,0,480,6,RED)
canvas.text(65,57,'KOLEDAR365 / KOLEDAR CSD',17,BLUE,True)
canvas.text(65,126,'Izbrana izplačila ob koncu leta 2026',44,INK,True)
canvas.text(65,169,'Datumi nakazil po objavljenem terminskem planu. Brez internih rokov vnosa na CSD.',18,MUTED)
canvas.rect(65,213,1306,72,'#12385e',10)
canvas.text(90,258,'PREJEMEK',15,'#ffffff',True)
for i,month in enumerate((10,11,12)):
    canvas.text(691+i*269,258,MONTHS[month-1].upper(),17,'#ffffff',True,'center')
rows=[('otroski-dodatek',['Otroški dodatek']),('varstveni-dodatek',['Varstveni dodatek']),('socialna-pomoc-1',['Denarna socialna pomoč','I. obdelava']),('stipendije',['Državne in Zoisove','štipendije'])]
for i,(category,labels) in enumerate(rows):
    y=305+i*119;canvas.rect(65,y,1306,101,'#ffffff',8,'#dce5ee')
    for j,label in enumerate(labels):canvas.text(90,y+(49 if len(labels)==1 else 40)+j*27,label,21 if j==0 else 18,INK if j==0 else MUTED,j==0)
    for column,month in enumerate((10,11,12)):
        event=next(event for event in DATA['events'] if event['category']==category and event['plan_month']==f'2026-{month:02d}')
        day=date.fromisoformat(event['date']);assert day.month==month
        x=691+column*269;canvas.text(x,y+44,f'{day.day}. {day.month}.',30,BLUE,True,'center');canvas.text(x,y+73,DAYS[day.weekday()],15,MUTED,False,'center')
canvas.text(65,834,'Vir: CSD · Preverjeno 21. 10. 2026 · Prikazani so izbrani prejemki.',17,MUTED)
canvas.text(65,869,'Celoten pregled: koledar365.si/izplacila-socialnih-transferjev/',17,BLUE,True)
canvas.save('socialni-transferji-2026')
