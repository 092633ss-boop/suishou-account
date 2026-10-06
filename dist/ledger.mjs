export const STORAGE_KEY='suishou-ledger.v1:'+encodeURIComponent(new URL('./',import.meta.url).pathname);
export const TYPES=['income','expense'];
export function emptyLedger(){const names={expense:['餐饮','交通','购物','居住','娱乐','医疗','其他'],income:['工资','奖金','兼职','投资','其他']};return {version:1,categories:TYPES.flatMap(type=>names[type].map((name,i)=>({id:`${type}-${i}`,type,name}))),transactions:[]};}
export function localDate(date=new Date()){return `${String(date.getFullYear()).padStart(4,'0')}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function validMonth(month){return typeof month==='string'&&/^\d{4}-(0[1-9]|1[0-2])$/.test(month)&&Number(month.slice(0,4))>=1;}
export function daysInMonth(month){if(!validMonth(month))throw Error('请选择有效月份');const year=Number(month.slice(0,4)),m=Number(month.slice(5));return m===2?((year%4===0&&year%100!==0)||year%400===0?29:28):[4,6,9,11].includes(m)?30:31;}
export function validDate(date){return typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&validMonth(date.slice(0,7))&&Number(date.slice(8))>=1&&Number(date.slice(8))<=daysInMonth(date.slice(0,7));}
export function parseAmount(raw){if(typeof raw!=='string'||raw.length>100||!/^\d+(\.\d{1,2})?$/.test(raw.trim()))throw Error('金额需大于零，最多两位小数');const [yuan,dec='']=raw.trim().split('.'),exact=BigInt(yuan)*100n+BigInt(dec.padEnd(2,'0'));if(exact<=0n||exact>BigInt(Number.MAX_SAFE_INTEGER))throw Error('请输入有效金额，金额不能过大');return Number(exact);}
export function amountInput(cents){return `${Math.floor(cents/100)}.${String(cents%100).padStart(2,'0')}`;}
export function money(cents){const abs=Math.abs(cents);return `${cents<0?'-':''}¥${Math.floor(abs/100).toLocaleString('zh-CN')}.${String(abs%100).padStart(2,'0')}`;}
function validId(id){return typeof id==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(id);}
export function validateLedger(input){
  if(!input||input.version!==1||!Array.isArray(input.categories)||!Array.isArray(input.transactions))throw Error('备份格式或版本不支持');
  const ids=new Set(),names=new Set();const categories=input.categories.map(c=>{if(!c||!validId(c.id)||ids.has(c.id)||!TYPES.includes(c.type)||typeof c.name!=='string'||!c.name.trim()||c.name.trim().length>20)throw Error('分类数据无效或重复');const name=c.name.trim(),key=c.type+':'+name;if(names.has(key))throw Error('同类分类名称不能重复');ids.add(c.id);names.add(key);return {id:c.id,type:c.type,name};});
  if(TYPES.some(type=>!categories.some(c=>c.type===type)))throw Error('收入和支出都需要至少一个分类');
  const byId=new Map(categories.map(c=>[c.id,c])),transactionIds=new Set();let total=0;
  const transactions=input.transactions.map(t=>{if(!t||!validId(t.id)||transactionIds.has(t.id)||!TYPES.includes(t.type)||!Number.isSafeInteger(t.amountCents)||t.amountCents<=0||byId.get(t.categoryId)?.type!==t.type||!validDate(t.date)||typeof t.note!=='string'||t.note.length>500)throw Error('记录数据无效，请检查金额、日期和分类');total+=t.amountCents;if(!Number.isSafeInteger(total))throw Error('账本累计金额过大');transactionIds.add(t.id);return {id:t.id,type:t.type,amountCents:t.amountCents,categoryId:t.categoryId,date:t.date,note:t.note};});
  return {version:1,categories,transactions};
}
export function saveTransaction(ledger,input,id){
  if(!TYPES.includes(input.type)||!validDate(input.date))throw Error('请选择有效的收支类型和日期');if(ledger.categories.find(c=>c.id===input.categoryId)?.type!==input.type)throw Error('请选择对应的分类');if(typeof input.note!=='string'||input.note.length>500)throw Error('备注不能超过500字');
  const record={id:id||crypto.randomUUID(),type:input.type,amountCents:parseAmount(input.amount),categoryId:input.categoryId,date:input.date,note:input.note.trim()};if(id&&!ledger.transactions.some(t=>t.id===id))throw Error('这笔记录已在其他页面删除，请重新打开');const transactions=id?ledger.transactions.map(t=>t.id===id?record:t):[...ledger.transactions,record];return {ledger:validateLedger({...ledger,transactions}),record};
}
export function deleteTransaction(ledger,id){if(!ledger.transactions.some(t=>t.id===id))throw Error('这笔记录已被删除');return {...ledger,transactions:ledger.transactions.filter(t=>t.id!==id)};}
export function saveCategory(ledger,type,raw,id){const name=raw.trim();if(!TYPES.includes(type)||!name||name.length>20)throw Error('分类名称需为1–20字');if(ledger.categories.some(c=>c.type===type&&c.name===name&&c.id!==id))throw Error('同类分类名称不能重复');if(id&&!ledger.categories.some(c=>c.id===id&&c.type===type))throw Error('分类已不存在');const category={id:id||crypto.randomUUID(),type,name};return validateLedger({...ledger,categories:id?ledger.categories.map(c=>c.id===id?category:c):[...ledger.categories,category]});}
export function monthlySummary(ledger,month){
  const days=daysInMonth(month),records=ledger.transactions.filter(t=>t.date.startsWith(month+'-')),daily=Array.from({length:days},(_,i)=>({date:`${month}-${String(i+1).padStart(2,'0')}`,incomeCents:0,expenseCents:0}));let incomeCents=0,expenseCents=0;const sums=new Map();
  for(const t of records){if(t.type==='income')incomeCents+=t.amountCents;else expenseCents+=t.amountCents;daily[Number(t.date.slice(8))-1][t.type+'Cents']+=t.amountCents;sums.set(t.categoryId,(sums.get(t.categoryId)||0)+t.amountCents);}
  const categories=ledger.categories.filter(c=>sums.has(c.id)).map(c=>({...c,amountCents:sums.get(c.id)})).sort((a,b)=>b.amountCents-a.amountCents);
  return {month,incomeCents,expenseCents,balanceCents:incomeCents-expenseCents,count:records.length,categories,daily};
}
export function persistLedger(storage,ledger){const clean=validateLedger(ledger);storage.setItem(STORAGE_KEY,JSON.stringify(clean));return clean;}
