export const giftStyles = ['elegant','mystery','celebration','minimal','warm'] as const;
export const giftStyleNames = ['Élégant','Mystère','Célébration','Minimal','Chaleureux'];
export const giftMessages = {
 Universel: 'Je t’offre cette œuvre. J’espère qu’elle te plaira et qu’elle t’emmènera plus loin… Bonne découverte !',
 Amical: 'Je suis tombé sur cette œuvre et j’ai pensé à toi. Je te l’offre : profite-en bien !',
 Mystère: 'Je ne vais rien te révéler… mais je pense que tu dois vraiment découvrir cette histoire. Je te l’offre.',
 Anniversaire: 'Joyeux anniversaire ! Je t’offre cette œuvre pour prolonger la célébration avec une belle découverte.',
 'Très court': 'Pour toi 🎁 Bonne lecture et belle découverte !',
};
export const thankMessages = {
 Simple: 'Merci beaucoup pour ce cadeau ! Je viens de l’activer sur JYO.',
 Chaleureux: 'Merci beaucoup pour cette belle attention. Je viens d’activer mon cadeau sur JYO et j’ai hâte de commencer.',
 Court: 'Merci pour le cadeau 🎁 Je viens de l’activer sur JYO !',
};
export const DAY = 86400000;
export const giftStatus = (g:{status:string;expires_at?:number|null;sent_at?:number|null}, now=Date.now()) =>
 g.status==='UNCLAIMED'&&g.expires_at&&g.expires_at<=now?'EXPIRED':g.status;
export const giftStatusLabel = (g:any) => ({CLAIMED:'Activé',REVOKED:'Révoqué',EXPIRED:'Expiré',UNCLAIMED:g.sent_at?'Envoyé':'Non utilisé'}[giftStatus(g)]||g.status);
export const orderStatusLabel = (status:string) => ({DRAFT:'À confirmer',PENDING_PAYMENT:'Paiement en vérification',PAID:'Paiement confirmé · génération en cours',FULFILLED:'Cadeaux disponibles',CANCELLED:'Annulé',REFUNDED:'Remboursé'}[status]||status);
export const publicSenderName = (value:string) => value.includes('@')?'Un lecteur JYO':value.trim().slice(0,80)||'Un lecteur JYO';
