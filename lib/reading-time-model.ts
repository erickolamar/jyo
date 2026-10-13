export function readingDay(at:number,timezone='Africa/Douala'){return new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(at)}
export function bitCount(value:bigint){let n=0;while(value){value&=value-BigInt(1);n++}return n}
export function idleLimit(text:string){return Math.min(300000,Math.max(120000,text.trim().split(/\s+/).length/160*60000+30000))}
// Union seconds across tabs and devices before assigning them to a book.
export function readingTotals(slots:any[],manual:any[],timezone:string,book='',format='ALL'){
 const seen=new Map<number,bigint>(),days=new Map<string,{day:string;automatic:number;manual:number}>();
 const add=(day:string,kind:'automatic'|'manual',seconds:number)=>{const row=days.get(day)||{day,automatic:0,manual:0};row[kind]+=seconds;days.set(day,row)};
 for(const row of [...slots].sort((a,b)=>a.minute-b.minute||a.book_key.localeCompare(b.book_key)||a.format.localeCompare(b.format))){const mask=BigInt(row.mask),used=seen.get(row.minute)||BigInt(0);seen.set(row.minute,used|mask);if((!book||row.book_key===book)&&(format==='ALL'||row.format===format))add(readingDay(row.minute*60000,timezone),'automatic',bitCount(mask&~used))}
 for(const row of manual)if((!book||row.book_key===book)&&(format==='ALL'||row.format===format))add(row.day,'manual',row.seconds);
 return [...days.values()].sort((a,b)=>a.day.localeCompare(b.day));
}

export function secondsAfter(slots:any[],start:number){return slots.filter(s=>(s.minute+1)*60000>start).map(s=>{const cutoff=Math.max(0,Math.min(60,Math.ceil((start-s.minute*60000)/1000)));const before=(BigInt(1)<<BigInt(cutoff))-BigInt(1);return {...s,mask:(BigInt(s.mask)&~before).toString()}})}
