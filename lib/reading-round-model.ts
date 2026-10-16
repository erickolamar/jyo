export const privateProgress=(book:any)=>Math.max(Number(book.position?.percentage)||0,Number(book.furthest_percentage)||0);
export function roundLabel(round:number){return round>1?round+'ᵉ lecture':''}
