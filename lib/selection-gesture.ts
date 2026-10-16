export type GesturePoint={x:number;y:number};
export function createSelectionGesture(options:{hold:(p:GesturePoint)=>void;drag:(p:GesturePoint)=>void;cancelSelection:()=>void;active:()=>boolean;now:()=>number;schedule:(fn:()=>void,ms:number)=>unknown;unschedule:(id:unknown)=>void}){
 let origin:GesturePoint|null=null,timer:unknown=null,held=false,moved=false,blockedUntil=0,lastTap:{point:GesturePoint;time:number}|null=null;
 const distance=(a:GesturePoint,b:GesturePoint)=>Math.hypot(a.x-b.x,a.y-b.y);
 const stopTimer=()=>{if(timer!=null)options.unschedule(timer);timer=null};
 const cancel=()=>{stopTimer();origin=null;held=false;moved=false};
 return {
  down(p:GesturePoint){cancel();origin=p;timer=options.schedule(()=>{timer=null;if(origin&&!moved){held=true;lastTap=null;blockedUntil=options.now()+600;options.hold(origin)}},550)},
  move(p:GesturePoint){if(!origin)return false;if(held){options.drag(p);blockedUntil=options.now()+600;return true}if(distance(origin,p)>12){moved=true;stopTimer();lastTap=null}return false},
  up(p:GesturePoint){stopTimer();const used=held;if(origin&&!held&&!moved){const now=options.now();if(lastTap&&now-lastTap.time<330&&distance(lastTap.point,p)<28&&options.active()){options.cancelSelection();blockedUntil=now+600;lastTap=null}else lastTap={point:p,time:now}}if(held)blockedUntil=options.now()+600;origin=null;held=false;moved=false;return used},
  cancel,
  busy:()=>held||options.now()<blockedUntil,
 };
}
