import {makeEdition,validateEdition} from './edition.mjs';
import {localDate} from '../../public/horoscope/math-v1.mjs';
let cachedDay,cachedEdition;
export function currentEdition(day=localDate()) {
  if(day===cachedDay)return cachedEdition;
  const edition=validateEdition(makeEdition(day),day);
  if(day===localDate()){cachedDay=day;cachedEdition=edition;}
  return edition;
}
