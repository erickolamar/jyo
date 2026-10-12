# JYO — Évolutions V12, 12 octobre 2026

## Continuité et périmètre
Extension de V11 (c867d3dd75110322891ae50a84b7bdcdb3118c16) dans le même projet Sites. Aucun catalogue, compte, droit, paiement ou livre existant n’est recréé. Le lecteur et le moteur PDF existants sont conservés. La conversion fonctionne uniquement pendant que la fenêtre est ouverte, sans tâche serveur en arrière-plan. Limites conservées : PDF de 40 Mo, 2 000 pages, images de 8 Mo. Pas d’OCR ajouté ; les avertissements du moteur restent affichés.

## Implémentation
- `app/personal-books.tsx` : création manuelle, import PDF/texte, couverture stable, métadonnées, sauvegarde automatique sérialisée, conflits explicites, lecture après expiration Premium, corbeille/restauration, cache mémoire de deux livres revalidé côté serveur.
- `app/page-composer.tsx`, `lib/book-editing.ts` : texte enrichi, images, marges, pages, déplacements de blocs, coupure/copier/coller, sauts, annulation/rétablissement et redistribution explicite des longs textes. La pagination adaptative finale reste celle du lecteur commun.
- `app/api/personal/route.ts` : propriété vérifiée sur chaque livre et image, révisions atomiques, versions de documents immuables, progression et annotations préservées pendant l’édition.
- `app/book-opening.tsx`, `app/book-experience.tsx`, `app/private-books.css` : attente contextualisée, échec récupérable, navigation clavier du dialogue, animations légères avec réduction des mouvements.
- `lib/publication-date.ts`, `app/publication-date.tsx`, `app/editorial-experience.tsx`, `lib/editorial.ts` : date validée et localisée, masquée si absente du catalogue ; date de création par défaut pour les livres privés.
- `lib/book-model.ts`, `app/book-pagination.ts`, `app/book-reader.tsx` : extensions compatibles pour les marges et le soulignement.

## Stockage et migration
Pas de nouvelle table nécessaire : extension des métadonnées privées existantes dans `settings`, documents/images toujours dans R2. Les anciens enregistrements sont normalisés à la lecture (révision 0, statut ready, ancienne clé R2 conservée). Une édition écrit un nouvel objet puis change sa référence par comparaison atomique de révision. Les versions précédentes sont conservées ; aucun effacement irréversible de données existantes n’est effectué. Une politique de rétention des anciennes versions pourra être ajoutée séparément si le volume le justifie.

## Accès
Créer/modifier/importer demande l’avantage Premium configuré. Lire, annoter, déplacer vers la corbeille et restaurer un livre déjà possédé restent possibles après expiration. Les livres privés ne passent jamais par le catalogue, les recommandations ou les partages publics. Le cache mémoire est vidé au changement d’utilisateur et revalidé avant lecture.

## Vérifications
223 contrôles automatiques : régressions des versions précédentes, droits, isolation propriétaire, conflits de révision, conservation de progression et annotations, corbeille/restauration, expiration Premium, dates invalides/locales et conservation du texte enrichi lors de déplacements/divisions.
Contrôle navigateur local avec données fictives : création et réouverture, gras/souligné persistants, ajout de deuxième page, déplacement/annulation, sauvegarde et aperçu dans le lecteur commun, ordinateur et viewport 390 × 844. Aucun contenu de production modifié pour ces essais.

## Performance et limites mesurées
La décoration du catalogue passe de 1 + 2N requêtes à 3 requêtes groupées : pour 50 œuvres, 101 avant et 3 après, vérifié automatiquement. Mesure SQLite en mémoire : 0,42 ms sur ce poste (hors réseau, non représentatif de la production). Éditeur/lecteur privé et conversion sont chargés à la demande. La mesure navigateur `jyo.private.open` couvre la récupération et la préparation, pas la peinture finale.
Les seuils <1 s local, <2 s cloud et <300 ms par onglet restent à mesurer sur appareils réels et réseau mobile : ils ne sont pas revendiqués comme garantis. L’animation ne prolonge pas artificiellement un chargement terminé. Ni nouvelle infrastructure de conversion ni OCR ni duplication de livre n’ont été ajoutés.
