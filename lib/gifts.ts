import {db,body,identity,admin,sameOrigin,json,route,str,integer,choice,HttpError,visible,publicSettings,isAdministrator} from './server';
import {setting,putSetting,plans} from './editorial';
import {track,published,get_next_best_action} from './jyo';
import {DAY,giftMessages,giftStyles,giftStatus,publicSenderName} from './gift-model';

const encoder=new TextEncoder();
const hex=(b:Uint8Array)=>Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');
export const hashGift=async(s:string)=>hex(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(s))));
const bytes=(s:string)=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const base64=(b:Uint8Array)=>btoa(String.fromCharCode(...b));
async function cipherKey(){
 const name='gifts:encryption-key';let key=await setting(name,null);
 if(!key){await db().prepare('INSERT OR IGNORE INTO settings(key,value) VALUES(?,?)').bind(name,JSON.stringify(base64(crypto.getRandomValues(new Uint8Array(32))))).run();key=await setting(name)}
 return crypto.subtle.importKey('raw',bytes(key),'AES-GCM',false,['encrypt','decrypt']);
}
async function seal(value:string,key?:CryptoKey){const iv=crypto.getRandomValues(new Uint8Array(12));return base64(iv)+'.'+base64(new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key||await cipherKey(),encoder.encode(value))))}
async function unseal(value:string,key?:CryptoKey){const [iv,data]=value.split('.');return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(iv)},key||await cipherKey(),bytes(data)))}
const requestId=(v:any)=>{const id=str(v,80);if(!/^[a-f0-9-]{36}$/i.test(id))throw new HttpError(400,'Identifiant de confirmation invalide.');return id};
export async function giftPrices(){const p=await setting('gifts:prices',{});return Object.fromEntries([3,7,14,30].map(d=>[d,Number.isInteger(p[d])&&p[d]>0?p[d]:null]))}
export async function saveGiftPrices(b:any){const prices=Object.fromEntries([3,7,14,30].map(d=>[d,b[d]==null||b[d]===''?null:integer(b[d],1,1000000)]));await putSetting('gifts:prices',prices);return prices}
export async function createGiftOrder(b:any,user:any,isAdmin=false){
 const recognized=await isAdministrator(user.userId);if(isAdmin&&!recognized)throw new HttpError(403,'Accès réservé à l’administration.');isAdmin=recognized;
 const id=requestId(b.request_id),existing=await db().prepare('SELECT * FROM gift_orders WHERE id=?').bind(id).first<any>();
 if(existing){if(existing.buyer_user_id!==user.userId||existing.source!==(isAdmin?'ADMIN':'USER'))throw new HttpError(409,'Confirmation déjà utilisée.');return existing}
 const type=choice(b.gift_type,['WORK','SUBSCRIPTION','JYO_DAYS']),quantity=integer(b.quantity,1,isAdmin?100:25);
 if(type==='JYO_DAYS'&&!isAdmin)throw new HttpError(403,'Les jours d’accès JYO sont réservés aux cadeaux administrateur.');
 if(b.context==='book'&&type!=='WORK'||b.context==='jyo'&&type==='WORK')throw new HttpError(400,'Ce cadeau ne correspond pas au partage choisi.');
 const offer=type==='SUBSCRIPTION'?(await plans()).find((p:any)=>p.id===choice(b.plan,['CLASSIC','PREMIUM'])):null;
 if(type==='SUBSCRIPTION'&&!offer)throw new HttpError(400,'Abonnement indisponible.');
 const workId=type==='WORK'||offer?.bookCredit?str(b.work_id,80):null;
 const days=type==='JYO_DAYS'?integer(b.days,1,3650):offer?offer.days:null;
 let price=offer?.price||0;
 if(type==='WORK'||offer?.bookCredit){const work=await db().prepare(`SELECT * FROM works WHERE id=? AND ${visible}`).bind(workId,Date.now()).first<any>();if(!work)throw new HttpError(400,offer?.bookCredit?'Choisissez l’œuvre incluse dans cet abonnement.':'Cette œuvre n’est pas disponible.');if(type==='WORK')price=Number((await setting('editorial:works'))[workId!]?.price)||0;}
 if(!isAdmin&&price<=0)throw new HttpError(400,'Cette offre n’est pas disponible à la vente.');
 if(isAdmin)price=0;
 const card=b.card?choice(b.card_style||'elegant',[...giftStyles]):null,message=str(b.message,600)|| (type==='WORK'?giftMessages.Universel:type==='SUBSCRIPTION'?'Je t’offre un abonnement JYO '+offer.name+'. Bonne découverte !':'Je t’offre quelques jours pour découvrir JYO. Ici, on va plus loin…'),sender=publicSenderName(str(b.sender_name,80)||user.displayName),activationDays=isAdmin?integer(b.activation_days||30,1,3650):30;
 const recipients=Array.from({length:quantity},(_,i)=>({name:str(b.recipients?.[i]?.name,80),message:str(b.recipients?.[i]?.message,600)||message}));
 const now=Date.now();await db().prepare('INSERT OR IGNORE INTO gift_orders(id,buyer_user_id,source,gift_type,work_id,days,quantity,unit_price,total_price,status,sender_display_name,default_message,card_style,recipients,activation_days,created_at,updated_at,plan,plan_name,book_credit) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,user.userId,isAdmin?'ADMIN':'USER',type,workId,days,quantity,price,price*quantity,isAdmin?'PAID':'DRAFT',sender,message,card,JSON.stringify(recipients),activationDays,now,now,offer?.id||null,offer?.name||null,offer?.bookCredit?1:0).run();
 await track('gift_flow_started',user.userId,workId,null,{order_id:id});return (await db().prepare('SELECT * FROM gift_orders WHERE id=?').bind(id).first<any>())!;
}
export async function fulfillGiftOrder(id:string){
 // The payment is checked again here; an owner cannot turn a pending order into access.
 const order=await db().prepare('SELECT o.* FROM gift_orders o LEFT JOIN payments p ON p.id=o.payment_id WHERE o.id=? AND o.status IN (\'PAID\',\'FULFILLED\') AND (o.source=\'ADMIN\' OR p.status=\'APPROVED\')').bind(id).first<any>();
 if(!order)throw new HttpError(409,'Le paiement doit être confirmé avant de créer les cadeaux.');
 const cipher=await cipherKey();
 const present=new Set((await db().prepare('SELECT slot FROM gift_tokens WHERE gift_order_id=?').bind(id).all<any>()).results.map(g=>g.slot)),recipients=JSON.parse(order.recipients),statements=[];
 for(let i=0;i<order.quantity;i++){if(present.has(i))continue;const secret=hex(crypto.getRandomValues(new Uint8Array(32))),tokenId=crypto.randomUUID(),code='JYO-'+hex(crypto.getRandomValues(new Uint8Array(8))).toUpperCase().match(/.{1,4}/g)!.join('-');
 statements.push(db().prepare("INSERT OR IGNORE INTO gift_tokens(id,gift_order_id,slot,token_hash,token_cipher,display_code,status,recipient_name,message,expires_at,created_at) SELECT ?,?,?,?,?,?,'UNCLAIMED',?,?,?,? FROM gift_orders o LEFT JOIN payments p ON p.id=o.payment_id WHERE o.id=? AND o.status IN ('PAID','FULFILLED') AND (o.source='ADMIN' OR p.status='APPROVED')").bind(tokenId,id,i,await hashGift(secret),await seal(secret,cipher),code,recipients[i]?.name||'',recipients[i]?.message||order.default_message,Date.now()+order.activation_days*DAY,Date.now(),id));
 }
 for(let i=0;i<statements.length;i+=20)await db().batch(statements.slice(i,i+20));
 await db().prepare("UPDATE gift_orders SET status='FULFILLED',updated_at=? WHERE id=? AND status IN ('PAID','FULFILLED') AND quantity=(SELECT COUNT(*) FROM gift_tokens WHERE gift_order_id=?)").bind(Date.now(),id,id).run();
 if(statements.length)await track('gift_tokens_generated',order.buyer_user_id,order.work_id,null,{order_id:id});
}
export async function ownedOrder(id:string,userId:string,isAdmin=false){const o=await db().prepare('SELECT * FROM gift_orders WHERE id=?').bind(id).first<any>();if(!o||(!isAdmin&&o.buyer_user_id!==userId))throw new HttpError(404,'Cadeau introuvable.');return o}
export async function giftOrderResult(id:string,userId:string,isAdmin=false){
 let o=await ownedOrder(id,userId,isAdmin);let generationError='';if(['PAID','FULFILLED'].includes(o.status)){try{await fulfillGiftOrder(id)}catch{generationError='La génération est incomplète. Réessayez : aucun nouveau paiement n’est nécessaire.'}o=await ownedOrder(id,userId,isAdmin)}
 const rows=(await db().prepare('SELECT * FROM gift_tokens WHERE gift_order_id=? ORDER BY slot').bind(id).all<any>()).results;
 const cipher=rows.length?await cipherKey():undefined;
 const tokens=await Promise.all(rows.map(async g=>({id:g.id,display_code:g.display_code,status:giftStatus(g),recipient_name:g.recipient_name,message:g.message,expires_at:g.expires_at,claimed_at:g.claimed_at,sent_at:g.sent_at,thank_message:g.thank_message,url:'/g/'+await unseal(g.token_cipher,cipher)})));
 const work=o.work_id?await db().prepare('SELECT id,title,slug,cover FROM works WHERE id=?').bind(o.work_id).first():null;
 const payment=o.payment_id?await db().prepare('SELECT status,note,reference FROM payments WHERE id=?').bind(o.payment_id).first():null;
 return {order:o,payment,work,tokens,generation_error:generationError,missing:Math.max(0,o.quantity-tokens.length)};
}
export async function payGiftOrder(b:any,userId:string){
 const o=await ownedOrder(str(b.gift_order_id,80),userId);if(o.source!=='USER')throw new HttpError(400,'Ce cadeau ne nécessite pas de paiement.');if(o.gift_type==='JYO_DAYS'&&o.status==='DRAFT')throw new HttpError(403,'Les jours d’accès JYO sont réservés aux cadeaux administrateur.');if(o.status!=='DRAFT')return {id:o.payment_id,status:o.status,order_id:o.id};
 const provider=choice(b.provider,['MTN','ORANGE']),reference=str(b.reference,80).toUpperCase().replace(/\s/g,''),phone=str(b.phone,20).replace(/[\s()-]/g,'');
 if(!/^[A-Z0-9-]{5,80}$/.test(reference)||!/^\+?\d{8,15}$/.test(phone))throw new HttpError(400,'Vérifiez le numéro et la référence de transaction.');
 const s=await publicSettings();if(!(provider==='MTN'?s.mtn:s.orange)||!s.beneficiary)throw new HttpError(503,'Ce moyen de paiement n’est pas encore disponible.');
 if(await db().prepare('SELECT id FROM payments WHERE provider=? AND reference=?').bind(provider,reference).first())throw new HttpError(409,'Cette référence a déjà été transmise.');
 const id=crypto.randomUUID(),now=Date.now();
 await db().batch([
 db().prepare("UPDATE gift_orders SET status='PENDING_PAYMENT',payment_id=?,updated_at=? WHERE id=? AND status='DRAFT'").bind(id,now,o.id),
 db().prepare("INSERT INTO payments(id,user_id,provider,reference,phone,amount,status,return_to,created_at,note) SELECT ?,buyer_user_id,?,?,?,total_price,'PENDING',?,? ,'' FROM gift_orders WHERE id=? AND payment_id=? AND status='PENDING_PAYMENT'").bind(id,provider,reference,phone,'/gifts?order='+o.id,now,o.id,id),
 db().prepare('INSERT INTO settings(key,value) SELECT ?,? FROM payments WHERE id=?').bind('payment:'+id,JSON.stringify({product:'GIFT',order_id:o.id,gift_type:o.gift_type,quantity:o.quantity,days:o.days,plan_name:o.plan_name,work_id:o.work_id}),id)
 ]);const current=await ownedOrder(o.id,userId);await track('gift_checkout_started',userId,o.work_id,null,{order_id:o.id});return {id:current.payment_id,status:current.status,order_id:o.id};
}
export async function reviewGiftPayment(p:any,decision:string,note:string,actor:string){
 const marker=crypto.randomUUID(),now=Date.now();await db().batch([
 db().prepare("UPDATE payments SET status=?,reviewed_at=?,reviewed_by=?,note=? WHERE id=? AND status='PENDING'").bind(decision,now,marker,note,p.id),
 db().prepare("UPDATE gift_orders SET status=?,updated_at=? WHERE payment_id=? AND status='PENDING_PAYMENT' AND EXISTS (SELECT 1 FROM payments WHERE id=? AND reviewed_by=?)").bind(decision==='APPROVED'?'PAID':'DRAFT',now,p.id,p.id,marker),
 db().prepare('UPDATE payments SET reviewed_by=? WHERE id=? AND reviewed_by=?').bind(actor,p.id,marker)
 ]);const o=await db().prepare('SELECT id,buyer_user_id,work_id FROM gift_orders WHERE payment_id=?').bind(p.id).first<any>();
 if(decision==='APPROVED'&&o){await track('gift_payment_completed',o.buyer_user_id,o.work_id,null,{order_id:o.id});try{await fulfillGiftOrder(o.id)}catch{return {ok:true,generation_pending:true}}}return {ok:true};
}
async function tokenRow(secret:string){if(!/^[a-f0-9]{64}$/.test(secret))throw new HttpError(404,'Ce cadeau n’est plus valide.');const row=await db().prepare('SELECT t.*,o.gift_type,o.work_id,o.days,o.plan,o.plan_name,o.book_credit,o.sender_display_name,o.card_style,o.source,o.buyer_user_id FROM gift_tokens t JOIN gift_orders o ON o.id=t.gift_order_id WHERE t.token_hash=? AND o.status IN (\'PAID\',\'FULFILLED\')').bind(await hashGift(secret)).first<any>();if(!row)throw new HttpError(404,'Ce cadeau n’est plus valide.');return row}
export async function giftPreview(secret:string,userId?:string){
 const g=await tokenRow(secret),work=g.work_id?await db().prepare(`SELECT id,title,author,cover,slug FROM works WHERE id=? AND ${visible}`).bind(g.work_id,Date.now()).first<any>():null;
 const status=giftStatus(g),mine=!!userId&&g.claimed_by_user_id===userId,owned=!!userId&&g.gift_type==='WORK'&&!!await db().prepare("SELECT id FROM entitlements WHERE user_id=? AND work_id=? AND access_scope='WORK' AND valid_until IS NULL AND valid_from<=?").bind(userId,g.work_id,Date.now()).first();
 const started=!!userId&&!!g.work_id&&!!await db().prepare('SELECT content_id FROM user_progress WHERE user_id=? AND work_id=? LIMIT 1').bind(userId,g.work_id).first();
 return {started,target:mine?await giftTarget(g,userId!):null,id:g.id,display_code:g.display_code,status,sender_name:g.sender_display_name,recipient_name:g.recipient_name,message:g.message,card_style:g.card_style,gift_type:g.gift_type,days:g.days,plan:g.plan,plan_name:g.plan_name,book_credit:!!g.book_credit,expires_at:g.expires_at,valid_until:g.valid_until,work,mine,owned,available:g.gift_type!=='WORK'||!!work,thanked:!!g.thanked_at};
}
export async function giftTarget(g:any,userId:string){if(!g.work_id)return '/discover';const {contents,works}=await published();const w=works.find(w=>w.id===g.work_id);if(!w)return '/library';const progress=(await db().prepare('SELECT * FROM user_progress WHERE user_id=? AND work_id=?').bind(userId,g.work_id).all<any>()).results;const action=await get_next_best_action(userId,contents,progress,g.work_id);return action.action_type==='DISCOVER'?'/work/'+w.slug:action.target_url}
export async function claimGift(secret:string,userId:string){
 const g=await tokenRow(secret),now=Date.now();await track('gift_claim_started',userId,g.work_id,null,{});
 if(g.status==='CLAIMED'){if(g.claimed_by_user_id!==userId)throw new HttpError(409,'Ce cadeau a déjà été activé.');return {ok:true,already:true,target:await giftTarget(g,userId)}}
 if(giftStatus(g)!=='UNCLAIMED')throw new HttpError(410,'Ce cadeau n’est plus valide.');
 if(g.work_id&&!await db().prepare(`SELECT id FROM works WHERE id=? AND ${visible}`).bind(g.work_id,now).first())throw new HttpError(409,'Cette œuvre n’est pas disponible pour le moment. Votre cadeau est conservé.');
 // Compute extension inside the atomic batch, including concurrent activations and existing paid/granted access.
 const end="MAX(?,COALESCE((SELECT ends_at FROM subscriptions WHERE user_id=?),0),COALESCE((SELECT MAX(valid_until) FROM entitlements WHERE user_id=? AND access_scope IN ('GLOBAL','MEMBERSHIP')),0),COALESCE((SELECT MAX(CAST(json_extract(value,'$.until') AS INTEGER)) FROM settings WHERE (key=? OR (key LIKE 'membership-gift:%' AND json_extract(value,'$.user_id')=?)) AND json_extract(value,'$.revoked_at') IS NULL),0))+?";
 const updated=await db().batch([
 db().prepare(`UPDATE gift_tokens SET status='CLAIMED',claimed_by_user_id=?,claimed_at=?,valid_until=${g.gift_type!=='WORK'?end:'NULL'} WHERE id=? AND status='UNCLAIMED' AND (expires_at IS NULL OR expires_at>?) AND (?!='WORK' OR NOT EXISTS (SELECT 1 FROM entitlements WHERE user_id=? AND work_id=? AND access_scope='WORK' AND valid_until IS NULL AND valid_from<=?))`).bind(userId,now,...(g.gift_type!=='WORK'?[now,userId,userId,'membership:'+userId,userId,g.days*DAY]:[]),g.id,now,g.gift_type,userId,g.work_id,now),
 db().prepare("INSERT OR IGNORE INTO entitlements(id,user_id,work_id,access_scope,valid_from,valid_until,source,created_at) SELECT ?,claimed_by_user_id,?,?,claimed_at,valid_until,?,claimed_at FROM gift_tokens WHERE id=? AND status='CLAIMED' AND claimed_by_user_id=?").bind('gift:'+g.id,g.gift_type==='WORK'?g.work_id:null,g.gift_type==='WORK'?'WORK':g.gift_type==='SUBSCRIPTION'?'MEMBERSHIP':'GLOBAL',g.source==='ADMIN'?'ADMIN_GIFT':'GIFT',g.id,userId),
 ...(g.gift_type==='SUBSCRIPTION'&&g.book_credit?[db().prepare("INSERT OR IGNORE INTO entitlements(id,user_id,work_id,access_scope,valid_from,valid_until,source,created_at) SELECT ?,claimed_by_user_id,?,'WORK',claimed_at,NULL,?,claimed_at FROM gift_tokens WHERE id=? AND status='CLAIMED' AND claimed_by_user_id=?").bind('gift-book:'+g.id,g.work_id,g.source==='ADMIN'?'ADMIN_GIFT':'GIFT',g.id,userId)]:[]),
 ...(g.work_id?[db().prepare("INSERT OR IGNORE INTO saved_works(user_id,work_id,created_at) SELECT claimed_by_user_id,?,? FROM gift_tokens WHERE id=? AND status='CLAIMED' AND claimed_by_user_id=?").bind(g.work_id,now,g.id,userId)]:[])
 ]);
 const current=await tokenRow(secret);if(current.status!=='CLAIMED'||current.claimed_by_user_id!==userId){if(current.status==='CLAIMED')throw new HttpError(409,'Ce cadeau a déjà été activé.');if(giftStatus(current)!=='UNCLAIMED')throw new HttpError(410,'Ce cadeau n’est plus valide.');return {ok:false,owned:true,message:'Vous possédez déjà cette œuvre.'}}
 if(updated[0].meta.changes)await track('gift_claim_completed',userId,g.work_id,null,{});return {ok:true,target:await giftTarget(g,userId)};
}
export async function revokeGift(id:string,actor:string){if(!await db().prepare('SELECT id FROM gift_tokens WHERE id=?').bind(id).first())throw new HttpError(404,'Cadeau introuvable.');const now=Date.now();await db().batch([db().prepare("UPDATE gift_tokens SET status='REVOKED' WHERE id=? AND status!='REVOKED'").bind(id),db().prepare('UPDATE entitlements SET valid_until=? WHERE id IN (?,?)').bind(now,'gift:'+id,'gift-book:'+id)]);await track('gift_revoked',actor,null,null,{token_id:id})}
export async function thankGift(secret:string,userId:string,message:string){const g=await tokenRow(secret);if(g.status!=='CLAIMED'||g.claimed_by_user_id!==userId)throw new HttpError(403,'Activez votre cadeau avant de remercier son donneur.');const text=str(message,600);if(!text)throw new HttpError(400,'Écrivez un message.');await db().prepare('UPDATE gift_tokens SET thank_message=?,thanked_at=? WHERE id=?').bind(text,Date.now(),g.id).run();await track('gift_thank_you_sent',userId,g.work_id,null,{});return {ok:true}}
export async function resolveGiftCode(code:string,userId:string){
 const window=Math.floor(Date.now()/600000),key='gift-attempts:'+userId;
 await db().prepare("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=CASE WHEN json_extract(value,'$.window')=? THEN json_set(value,'$.count',json_extract(value,'$.count')+1) ELSE excluded.value END").bind(key,JSON.stringify({window,count:1}),window).run();
 if((await setting(key)).count>10)throw new HttpError(429,'Trop de tentatives. Réessayez dans dix minutes.');
 const normalized=code.trim().toUpperCase().replace(/\s/g,'');const g=await db().prepare('SELECT token_cipher FROM gift_tokens WHERE display_code=?').bind(normalized).first<any>();if(!g)throw new HttpError(404,'Ce cadeau n’est plus valide.');return {url:'/g/'+await unseal(g.token_cipher)};
}
export async function giftEvent(b:any,userId?:string){const allowed=['gift_option_viewed','gift_link_shared','gift_card_generated','gift_link_opened','gift_thank_you_started'];const event=choice(b.event,allowed);if(b.token_id){const g=await db().prepare('SELECT t.id,o.buyer_user_id,o.work_id FROM gift_tokens t JOIN gift_orders o ON o.id=t.gift_order_id WHERE t.id=?').bind(str(b.token_id,80)).first<any>();if(!g)throw new HttpError(404,'Cadeau introuvable.');if(g.buyer_user_id!==userId)await admin();if(event==='gift_link_shared')await db().prepare('UPDATE gift_tokens SET sent_at=? WHERE id=?').bind(Date.now(),g.id).run();await track(event,userId!,g.work_id);return}await track(event,userId||null,null)}
