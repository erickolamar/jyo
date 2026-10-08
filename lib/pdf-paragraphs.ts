import {blockText,type BookBlock} from './book-model';
// Join text fragments on the same line, then adjacent lines in the same column.
// Geometry is used only at conversion time; the original PDF remains available separately.
export function pdfReadingGroups<T extends BookBlock>(input:T[]):T[][]{
 const groups:T[][]=[];
 const result:BookBlock[]=[];
 for(const b of input){const last=result.at(-1);if(!last||last.type!=='text'||b.type!=='text'){result.push({...b,runs:b.runs?.map(r=>({...r}))});groups.push([b]);continue}
  const aSize=last.runs?.[0]?.size||12,bSize=b.runs?.[0]?.size||12,baseline=(last.y||0)+(last.height||aSize),dy=(b.y||0)-(last.y||0),gap=(b.x||0)-((last.x||0)+(last.width||0));
  const sameLine=Math.abs(dy)<Math.min(aSize,bSize)*.3&&gap>=-2&&gap<Math.max(aSize,bSize)*2;
  const nextLine=(b.y||0)>=baseline-aSize*.25&&(b.y||0)-baseline<aSize*.65&&Math.abs((b.x||0)-(last.x||0))<aSize*1.2&&Math.abs(aSize-bSize)<1&&last.align===b.align&&!/^\s*[•●–]/.test(blockText(b));
  if(sameLine||nextLine){groups.at(-1)!.push(b);const before=blockText(last),after=blockText(b);const spacer=before&&!/\s$/.test(before)&&after&&!/^\s|^[,.;:!?)]/.test(after)?' ':'';if(spacer)last.runs!.push({...last.runs!.at(-1)!,text:spacer});last.runs!.push(...b.runs!.map(r=>({...r})));last.width=Math.max(last.width||0,(b.x||0)+(b.width||0)-(last.x||0));last.height=Math.max(last.height||aSize,(b.y||0)+(b.height||bSize)-(last.y||0))}
  else {result.push({...b,runs:b.runs?.map(r=>({...r}))});groups.push([b])}
 }
 return groups;
}
