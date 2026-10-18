# Module Offrir

Spécification : JYO.docx fourni le 18 octobre 2026.

| Besoin | Réutilisation / intégration |
| --- | --- |
| Œuvres et prix unitaires | works, editorial:works |
| Comptes et connexion | identity, chatgpt-auth, retour /g/… |
| Paiements | payments, /api/payments, validation /api/admin |
| Droits | entitlements, can_access ; appartenance Premium dérivée des cadeaux temporaires actifs |
| Partage | BookShare ; actions simples en premier |
| Cartes | ImageResponse, polices du partage et couvertures existantes |
| Administration | JyoAdmin, /api/admin/gifts ; anciens abonnements offerts conservés |
| Analytics | analytics_events ; aucun détail de lecture dans le suivi cadeau |
| Commandes et codes | gift_orders / gift_tokens, absents de l’existant |

Décisions validées : paiement MTN/Orange à validation manuelle ; jours cadeau = Premium et catalogue, sans achat définitif. Tarifs administrables, vente des jours désactivée avant configuration. Les droits acquis auparavant sont conservés.

Les liens secrets sont aléatoires, hachés pour la recherche et chiffrés pour permettre leur renvoi par le donneur. Un code visible distinct permet la saisie manuelle, avec limitation des tentatives. Les notifications de remerciement restent dans JYO, sans coordonnées privées dans les liens.

## Exploitation

- Administration → Lecteurs & accès → Cadeaux : génération, renvoi, suivi et révocation. Les anciens abonnements offerts gardent leur fonctionnement.
- « Tarifs des jours cadeau » accepte un montant pour 3, 7, 14 et 30 jours. Un champ vide ferme uniquement la vente de cette durée ; l’administration peut toujours offrir une durée personnalisée.
- Les paiements cadeaux apparaissent dans la liste habituelle des paiements. Une validation confirme l’encaissement, puis génère les liens. Un refus permet de soumettre une nouvelle référence.
- Une génération interrompue reprend à l’ouverture de la commande, ou avec « Reprendre la génération ». Les liens déjà créés restent identiques.
- Les détenteurs des liens activent leur cadeau depuis `/g/…`. Le retour de connexion conserve le lien et l’intention d’activation. Le donneur retrouve les statuts et les remerciements dans son profil ou `/gifts`.
- La clé de chiffrement est créée côté serveur dans les paramètres privés de la base ; les sauvegardes de cette base doivent la conserver pour permettre le renvoi des liens.

## Vérifications

375 contrôles serveur : paiement, reprise, droits œuvre et catalogue, extension des jours, concurrence, annulation atomique, révocation, expiration, code manuel, confidentialité et régressions existantes. Vérifications de l’interface à 390 × 844 et 1366 × 900, avec routes réelles et base SQLite de test isolée. Paiement et retour de connexion simulés localement ; aucun transfert réel effectué.
