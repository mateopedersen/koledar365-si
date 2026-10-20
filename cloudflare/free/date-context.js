export function ljubljanaDate(instant=new Date()) {
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Ljubljana',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(instant);
 const value=name=>parts.find(part=>part.type===name).value;
 return value('year')+'-'+value('month')+'-'+value('day');
}
export function horoscopeDisposition(publishedDay,today){return publishedDay===today?'today':publishedDay<today?'previous':'future'}
