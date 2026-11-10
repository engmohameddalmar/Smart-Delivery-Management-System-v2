const periods = new Set(['today','yesterday','7days','30days','3months','6months','12months','thisyear','custom']);
export function getDateRange(query={}) {
  const period=(query.period||'30days').toLowerCase();
  if(!periods.has(period))throw Object.assign(new Error('Invalid analytics period'),{statusCode:400});
  const now=new Date(),end=new Date(now),start=new Date(now);
  if(period==='custom'){
    if(!query.startDate||!query.endDate)throw Object.assign(new Error('startDate and endDate are required for a custom range'),{statusCode:400});
    const customStart=new Date(`${query.startDate}T00:00:00.000Z`),customEnd=new Date(`${query.endDate}T23:59:59.999Z`);
    if(Number.isNaN(customStart.getTime())||Number.isNaN(customEnd.getTime())||customStart>customEnd)throw Object.assign(new Error('Invalid custom date range'),{statusCode:400});
    return {start:customStart,end:customEnd,period};
  }
  if(period==='today'){start.setHours(0,0,0,0);}else if(period==='yesterday'){start.setDate(start.getDate()-1);start.setHours(0,0,0,0);end.setDate(end.getDate()-1);end.setHours(23,59,59,999);}else if(period==='thisyear'){start.setMonth(0,1);start.setHours(0,0,0,0);}else{const amounts={ '7days':['date',6], '30days':['date',29], '3months':['month',3], '6months':['month',6], '12months':['month',12] };const [unit,value]=amounts[period];if(unit==='date')start.setDate(start.getDate()-value);else start.setMonth(start.getMonth()-value);start.setHours(0,0,0,0);}
  return {start,end,period};
}
export const dateMatch=(field,range)=>({[field]:{$gte:range.start,$lte:range.end}});
export function trendFormat(range,requested){if(['daily','weekly','monthly'].includes(requested))return requested;if(['3months','6months','12months','thisyear'].includes(range.period))return 'monthly';return 'daily';}
export function dateGroup(format,field='$createdAt'){if(format==='monthly')return {$dateToString:{format:'%Y-%m',date:field}};if(format==='weekly')return {$dateToString:{format:'%G-W%V',date:field}};return {$dateToString:{format:'%Y-%m-%d',date:field}};}
