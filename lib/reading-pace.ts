// An estimate of active reading time, never evidence of comprehension.
export function readingSeconds(text:string,images=0){return Math.max(3,Math.ceil(text.trim().split(/\s+/).filter(Boolean).length/220*60)+images*5);}
export function paceCanValidate(seconds:number,required:number,atBottom:boolean){return atBottom&&seconds>=required;}
export function sessionReport(start:number,current:number,goal:any,now=Date.now()){
 const progress=Math.max(0,Math.min(1,current)),expected=goal?Math.max(0,Math.min(1,goal.start_progress+(1-goal.start_progress)*Math.max(0,Math.min(1,(now-goal.start_date)/Math.max(86400000,goal.target_date-goal.start_date))))):progress;
 return {gain:Math.max(0,(progress-start)*100),progress:progress*100,gap:(progress-expected)*100};
}
