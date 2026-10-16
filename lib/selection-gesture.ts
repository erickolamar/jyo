export type GesturePoint={x:number;y:number};
export function createSelectionGesture(options:{hold:(p:GesturePoint)=>void;drag:(p:GesturePoint)=>void;cancelSelection:()=>void;active:()=>boolean;now:()=>number;schedule:(fn:()=>void,ms:number)=>unknown;unschedule:(id:unknown)=>void}){
 let origin:GesturePoint|null=null,timer:unknown=null,held=false,moved=false,dragging=false,startedAt=0,armedUntil=0,blockedUntil=0,lastTap:{point:GesturePoint;time:number}|null=null;
 const distance=(a:GesturePoint,b:GesturePoint)=>Math.hypot(a.x-b.x,a.y-b.y);
 const stopTimer=()=>{if(timer!=null)options.unschedule(timer);timer=null};
 const resetPress=()=>{stopTimer();origin=null;held=false;moved=false;dragging=false};
 const cancel=()=>{resetPress();armedUntil=0;lastTap=null};
 return {
  down(p:GesturePoint){resetPress();origin=p;startedAt=options.now();if(options.active()||startedAt<armedUntil)timer=options.schedule(()=>{timer=null;if(origin&&!moved){held=true;armedUntil=0;lastTap=null;blockedUntil=options.now()+600;options.hold(origin)}},550)},
  move(p:GesturePoint){if(!origin)return false;if(held){if(!dragging&&distance(origin,p)<8)return true;dragging=true;options.drag(p);blockedUntil=options.now()+600;return true}if(distance(origin,p)>12){moved=true;stopTimer();armedUntil=0;lastTap=null}return false},
  up(p:GesturePoint){stopTimer();const used=held,now=options.now();if(origin&&!held&&!moved&&now-startedAt<=300){if(lastTap&&now-lastTap.time<330&&distance(lastTap.point,p)<28&&options.active()){options.cancelSelection();armedUntil=0;lastTap=null}else{if(!options.active())armedUntil=now+3000;lastTap={point:p,time:now}}blockedUntil=now+600}else if(!held&&!options.active())armedUntil=0;if(origin&&!moved||held)blockedUntil=now+600;resetPress();return used},
  cancel,
  busy:()=>held||options.now()<blockedUntil,
 };
}
