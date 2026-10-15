export function librarySummary(values:number[]){
 const progress=values.map(v=>Math.max(0,Math.min(100,Number(v)||0))),total=progress.length,completed=progress.filter(v=>v>=99.9).length;
 return {total,completed,completedPercent:total?Math.round(completed/total*100):0,average:total?Math.round(progress.reduce((a,b)=>a+b,0)/total):0};
}
