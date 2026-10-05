# ARCANUM V4

## Version livrée

Application de récits multimédias avec catalogue d’œuvres, page propre à chaque œuvre, lecteur texte, lecteurs audio et vidéo, bibliothèque, progression persistante, compte, espace Initié et administration. Interface française adaptée au mobile et à l’ordinateur, noir végétal, or patiné et titrage littéraire.

L’authentification est fournie par Sites : **Se connecter avec ChatGPT**. Il ne s’agit pas d’une inscription par mot de passe propre à ARCANUM. L’adresse administrateur configurée est `arnaud.banaken@gmail.com`. Les contrôles de rôle, d’abonnement et de publication s’effectuent sur le serveur.

## Première mise en service

1. Se connecter avec le compte ChatGPT correspondant à l’adresse administrateur, puis ouvrir `/admin`.
2. Sélectionner **Les Disparus du Dimanche**. La présentation est fournie par le cahier des charges ; elle n’est pas un chapitre du manuscrit.
3. Ajouter les vrais chapitres et médias. Le texte peut être collé ou importé en `.txt`. Audio : MP3, M4A, WAV, OGG. Vidéo : MP4, WebM. Limite de cette version : 40 Mo par fichier.
4. Choisir le format, l’ordre, l’accès et le statut. Les contenus peuvent être brouillons, programmés, publiés ou archivés.
5. Pour un accès **PREVIEW**, fournir un extrait textuel ou un fichier média court distinct. Le fichier complet est servi uniquement après contrôle des droits.
6. Les paiements s’ouvrent lorsqu’au moins un contenu Initié est publié dans une œuvre publiée.

## Encaissement

- MTN MoMo : **+237650315365**.
- Orange Money : **+237699742342**.
- Bénéficiaire : **Arnaud BANAKEN**.
- Accès : **1 500 F CFA pour 30 jours**, sans prélèvement récurrent.

Le lecteur effectue lui-même le transfert dans son application opérateur, puis transmet la référence et son numéro. La demande est conservée en attente. L’administrateur vérifie l’encaissement sur son compte opérateur avant de valider. La validation ouvre les droits pour 30 jours et garde la destination de lecture initiale. Un refus exige un motif. Une même transaction ne peut pas être validée deux fois.

Ce parcours est **manuel**, sans API marchande MTN/Orange et sans confirmation automatique. Pour automatiser, il faudra un compte marchand compatible, ses paramètres et des notifications serveur authentifiées ; ne jamais déduire un paiement réussi d’un retour navigateur.

## Données et sécurité

Les tables `works` et `contents` organisent les contenus par œuvre et format TEXT/AUDIO/VIDEO. L’accès FREE/PREVIEW/PREMIUM est individuel. `users`, `subscriptions`, `payments` et `user_progress` sont persistés dans D1. Les fichiers sont stockés dans R2, uniquement servis par une route qui vérifie les droits. `assets` conserve leurs métadonnées. Les préférences visuelles du lecteur sont locales à l’appareil.

Les opérations de validation et d’activation de l’abonnement sont groupées en transaction. Les API d’écriture exigent une identité et une origine correspondante ; les API d’administration exigent l’adresse configurée au serveur. L’expiration de l’abonnement est appliquée à chaque demande de contenu. Les brouillons et les œuvres archivées ne sont pas consultables par leur route publique.

## Limites avant lancement commercial

- Aucun manuscrit, enregistrement audio ou trailer réel n’a été fourni. Seul le synopsis est publié.
- Site privé au premier déploiement : l’ouverture au public et le choix d’un éventuel autre système de comptes restent à décider.
- Encaissement manuel uniquement ; absence de renouvellement automatique.
- Le hors-ligne avec licence signée, chiffrement et expiration n’est pas activé. Aucun téléchargement premium non protégé n’est proposé. Le manifest prépare une présentation autonome ; il ne garantit pas à lui seul une PWA hors-ligne.
- La lecture audio emploie le lecteur natif et Media Session. Le fonctionnement en arrière-plan dépend du navigateur et du système, et reste à vérifier sur les appareils de lancement.
- Les visuels additionnels propres à de futures œuvres, les conditions commerciales et les informations légales propres à l’exploitant sont à compléter avant ouverture publique.
- L’aperçu Cloudflare local a échoué sur cet ordinateur Windows avec une erreur du runtime. La compilation et les tests ciblés restent possibles ; les flux de bout en bout sur l’hébergement réel ne doivent pas être considérés vérifiés par ces tests.

## Vérification et maintenance

`node scripts/test-server.mjs` exécute les routes réelles sur une base SQLite en mémoire et un substitut R2 : autorisations, non-divulgation premium, extraits, import, progression, validation et expiration. Aucun paiement réel n’est réalisé. Ce test n’est pas un test de l’infrastructure Cloudflare ou des comptes opérateurs.

`node node_modules/typescript/bin/tsc --noEmit` vérifie les types. Les migrations proviennent de Drizzle et sont conservées dans `drizzle/`.

## Visuel original

Le visuel `public/hero.png` a été généré avec l’outil intégré ImageGen. Original conservé dans `../assets-source/les-disparus-du-dimanche-hero.png`.

Prompt : « Use case: photorealistic-natural. Asset type: original cinematic website hero background for the French narrative platform ARCANUM and its novel Les Disparus du Dimanche; landscape 1536x1024. A deserted city bus stopped on a wet city street at dawn, seen from outside, with a few clearly empty seats visible through the windows. An unsettling sense of mysterious absence. Empty urban street receding into soft fog, wet pavement with restrained reflections. Sophisticated photographic film still, realistic cinematic photography, subtle film grain. Wide landscape, bus weighted to the right of frame, three-quarter exterior view; the left half is dark atmospheric negative space suitable for hero text. Main bus subject compact enough to permit a portrait crop for book cover artwork. Low dawn light, fog, dim amber light glowing inside the empty bus, quiet and mysterious. Deep charcoal and black-green, muted antique gold highlights. No people, no text, no lettering, no route numbers, no logos, no watermarks, no UI. »


## Lecture PDF
Dans Administration → Ajouter un contenu → Lecture, choisir « Document PDF — mise en page originale ». Import de PDF sans mot de passe jusqu’à 40 Mo, stockés en R2 et référencés par les champs media_key/preview_key existants. Les lectures texte restent compatibles, sans migration de données.
Le lecteur utilise PDF.js, avec pages originales, sélection du texte, page précédente/suivante, numéro de page, zoom, adaptation à la largeur et reprise de la page sauvegardée. Pour PREVIEW, un PDF d’extrait distinct est obligatoire ; l’API conserve le contrôle d’accès au document complet. Le PDF n’est ni converti ni rendu public comme un fichier statique. Les formulaires interactifs, annotations éditables et PDF protégés par mot de passe ne sont pas pris en charge.
Validation : contrôles serveur de l’import et des droits (44 au total), vérification du lecteur sur un PDF de deux pages, affichages bureau et mobile.
