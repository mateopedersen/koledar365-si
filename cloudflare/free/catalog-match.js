export function matchPublicCalendar(row, options) {
 const saved=row.options,type=options.type;
 const monthScoped=type==='monthly'||(type==='lunar'&&options.lunar_scope!=='year')||(type==='workdays'&&options.workday_scope==='month');
 return saved.type===type&&saved.year===Number(options.year)&&saved.design===options.design
  &&saved.paper===(options.paper||'A4')&&saved.orientation===(options.orientation||'portrait')
  &&(!monthScoped||saved.month===Number(options.month||1))
  &&(saved.lunar_scope||'month')===(options.lunar_scope||'month')
  &&(saved.workday_scope||'year')===(options.workday_scope||'year')
  &&(!['weekly','shift','daily','family','school'].includes(type)||!options.date||options.date===saved.date);
}
