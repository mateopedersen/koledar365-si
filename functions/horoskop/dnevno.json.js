import {currentEdition} from '../../lib/horoscope/current.mjs';
import {localDate} from '../../public/horoscope/math-v1.mjs';
export async function onRequestGet({request}) {
  const today=localDate(),url=new URL(request.url),day=url.searchParams.get('date')||today;
  const oldest=new Date(today+'T12:00:00Z');oldest.setUTCDate(oldest.getUTCDate()-7);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||day>today||day<oldest.toISOString().slice(0,10))return Response.json({error:'Na voljo so današnji in zadnjih sedem dnevnih zapisov.'},{status:400,headers:{'Cache-Control':'no-store'}});
  try {
    const edition=currentEdition(day);
    return Response.json(edition,{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Horoscope-Date':day,'X-Robots-Tag':'noindex'}});
  } catch {return Response.json({error:'Dnevne izdaje trenutno ni mogoče pripraviti.'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
