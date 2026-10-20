import profiles from '../../data/horoscope/signs.json' with {type:'json'};
import {currentEdition} from './current.mjs';
const routes=new Map([['/horoskop/',''],['/horoskop/izracun-znamenja/',''],...profiles.map(p=>['/horoskop/'+p.slug+'/',p.slug])]);
export function datedSchema(html,edition,sign) {
  return html.replace(/(<script\b[^>]*type="application\/ld\+json"[^>]*>)([\s\S]*?)(<\/script>)/g,(match,start,json,end)=>{
    try{
      const schema=JSON.parse(json);
      for(const item of schema['@graph']||[])if(item['@type']==='Article'&&sign&&item['@id']?.endsWith('#dnevni-zapis')){
        item.headline=edition.signs[sign].title;item.datePublished=edition.generated_at;item.dateModified=edition.generated_at;
        item.description='Razvedrilna slovenska izdaja za '+edition.local_date+'.';
      }
      return start+JSON.stringify(schema).replace(/</g,'\\u003c')+end;
    }catch{return match;}
  });
}
export async function renderDailyHTML(context) {
  const {request,env}=context,path=new URL(request.url).pathname;
  if(!routes.has(path)||!['GET','HEAD'].includes(request.method))return context.next();
  // Fetch the public template, never a cached conditional 304 or a private route.
  const assetHeaders=new Headers(request.headers);assetHeaders.delete('if-none-match');assetHeaders.delete('if-modified-since');
  const asset=await env.ASSETS.fetch(new Request(request,{method:'GET',headers:assetHeaders}));
  if(!asset.ok||!asset.headers.get('content-type')?.includes('text/html'))return asset;
  try{
    const edition=currentEdition(),sign=routes.get(path),html=datedSchema(await asset.clone().text(),edition,sign);
    if(!html.includes('data-horoscope-app'))return asset;
    const headers=new Headers(asset.headers);
    for(const name of ['content-length','etag','last-modified','content-encoding'])headers.delete(name);
    headers.set('Cache-Control','no-store');headers.set('X-Horoscope-Date',edition.local_date);
    headers.set('X-Horoscope-Rendering','daily-html-v1');
    const response=new Response(html,{status:asset.status,headers});
    const rewriter=new HTMLRewriter().on('[data-horoscope-app]',{element(e){e.setAttribute('data-edition-day',edition.local_date);}});
    const text=(selector,value)=>rewriter.on(selector,{element(e){e.setInnerContent(value);}});
    text('[data-edition-status]','Današnja izdaja');
    rewriter.on('[data-edition-date]',{element(e){e.setAttribute('datetime',edition.local_date);e.setInnerContent(new Intl.DateTimeFormat('sl-SI',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Ljubljana'}).format(new Date(edition.local_date+'T12:00:00Z')));}});
    text('[data-moon-sign]','Luna v '+edition.sky.moon.locative);
    text('[data-moon-phase]',edition.sky.moon.phase+' · '+edition.sky.moon.illumination+' % osvetljenosti');
    if(sign)for(const [field,value] of Object.entries(edition.signs[sign]))if(typeof value==='string')text('[data-reading-field="'+field+'"]',value);
    for(const profile of profiles)text('[data-sign-card="'+profile.slug+'"] [data-card-copy]',edition.signs[profile.slug].title);
    const transformed=rewriter.transform(response);
    return request.method==='HEAD'?new Response(null,{status:transformed.status,headers:transformed.headers}):transformed;
  }catch{
    // A failure keeps the fallback's genuine date and content together.
    return asset;
  }
}
