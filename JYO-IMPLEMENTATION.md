# JYO — évolution de l’application existante

Cette version conserve le site, les comptes, les œuvres, les contenus et les paiements ARCANUM. La migration `0001` ajoute les données JYO sans supprimer les tables ni réinitialiser les données existantes. Les anciennes adresses françaises restent utilisables.

## Fonctionnalités livrées

- Identité JYO, accueil contextuel, découverte, bibliothèque et profil.
- Accès direct à la lecture en cours, enregistrement anonyme sur l’appareil, synchronisation après connexion et détection des conflits entre appareils.
- Progression de l’œuvre commune aux formats, sans compter deux fois une même partie. Correspondances de chapitres configurables dans l’administration.
- PDF avec mise en page originale, sélection de texte, marque-page manuel, pages, zoom, largeur adaptée, recherche, sommaire présent dans le fichier et plein écran selon le navigateur.
- Import PDF avec original conservé, empreinte, version, analyse des signets ou titres, découpage modifiable, plages gratuites/premium, brouillon, aperçu puis publication explicite. Un remplacement conserve l’ancienne version et reporte approximativement la dernière position sur la nouvelle.
- La distribution d’un chapitre PDF produit un fichier ne contenant que ses pages autorisées. Le PDF source mixte n’est jamais envoyé au lecteur gratuit.
- Lecteurs audio et vidéo, position automatique, vitesse, sauts de 15 secondes, minuterie et sous-titres WebVTT pour la vidéo.
- Paiements MTN MoMo et Orange Money existants, vérifiés manuellement. La destination de lecture est conservée. Les droits sont contrôlés côté serveur.
- Accès supplémentaires par œuvre ou catalogue, cadeaux, promotions et révocation.
- Objectifs avec date, rythme attendu, avance/retard et estimation de l’effort. Les rappels sont opt-in, au maximum une fois par jour, dans JYO à la prochaine visite. Ils ne sont pas des notifications push lorsque l’application est fermée.
- Fragments publics `/j/:slug`, passages autorisés et extraits audio/vidéo distincts importés par l’administrateur. Retirer l’autorisation de partage désactive les anciens fragments.
- Téléchargement explicite quand l’auteur l’autorise, licence signée liée au compte, validité maximale de sept jours et jamais au-delà du droit premium. La bibliothèque hors connexion est dans `/offline.html`. Les fichiers sont retirés au changement de compte ou à la déconnexion. La progression hors connexion est synchronisée au retour.
- Statistiques issues des événements réellement enregistrés depuis l’installation de cette version.

## Limites et évolutions prévues dans la spécification

- L’analyse PDF repose sur les signets et des titres détectables. Les PDF scannés n’ont pas d’OCR automatique. Le découpage doit être vérifié par l’auteur.
- Le mode de lecture PDF conserve les pages originales. La recomposition du texte (« reflow »), l’analyse par IA et les traitements en arrière-plan avancés restent des évolutions.
- Les extraits audio/vidéo doivent être préparés et importés séparément. Il n’y a pas de service de transcodage ou de montage automatique sur le serveur.
- Hors connexion, le PDF est ouvert par le lecteur intégré du navigateur ; la page saisie sert de marque-page. Les navigateurs qui ne permettent pas le stockage local ou l’affichage PDF intégré nécessitent une connexion et le lecteur JYO habituel.
- Les notifications en arrière-plan, la génération automatique de vignettes et de formes d’onde ne sont pas activées.
- Les paiements restent des transferts à validation manuelle ; aucune intégration API opérateur n’est simulée.

## Utilisation de l’import PDF

1. Ouvrir l’atelier avec le compte administrateur existant.
2. Créer ou sélectionner l’œuvre dans « Œuvres & paiements ».
3. Dans « Importer un PDF », sélectionner l’œuvre puis le document.
4. Vérifier les plages de pages ; diviser ou fusionner si nécessaire.
5. Appliquer le nombre de chapitres gratuits et ajuster les exceptions.
6. Enregistrer le découpage, utiliser « Voir », puis publier les chapitres.
7. Publier également l’œuvre si elle est encore en brouillon.

L’onglet Partage règle, contenu par contenu, les fragments publics et l’autorisation hors connexion. Les nouveaux contenus sont privés en brouillon jusqu’à publication explicite.

## Vérification

`node scripts/test-server.mjs` exécute les contrôles avec une base et des fichiers en mémoire : aucune donnée de production, aucun paiement réel. Le contrôle TypeScript et la compilation de production complètent ces tests. L’interface du lecteur PDF est vérifiée séparément dans un aperçu local.


## Lecteur unifié — octobre 2026

Le lecteur des contenus texte et PDF utilise désormais un document riche commun : pages, blocs, styles et illustrations. L’interface propose une ou deux pages, navigation au clavier et au doigt, recherche, surlignages personnels, reprise, réglages escamotables et plein écran.

Administration → Pages & lecteur permet de composer un texte enrichi, ajouter des images, régler le repère de pagination (1 800 caractères par défaut, de 300 à 8 000), convertir un PDF existant et vérifier le résultat dans le même lecteur. L’import d’un PDF source prépare automatiquement ses pages enrichies. Le PDF original reste conservé ; le téléchargement est désactivé par défaut et configurable. Les autorisations serveur s’appliquent au document, aux images et au téléchargement : un chapitre gratuit ne reçoit pas les pages premium de sa source.

En présentation d’auteur, les PDF gardent leurs coordonnées et leurs pages, avec texte sélectionnable et fond graphique séparé. Modifier la police ou la taille recompose le texte dans des pages ajustées à l’écran, avec sauts conservés entre pages sources ; le nombre de pages peut augmenter. Cette recomposition ne peut conserver simultanément toutes les positions initiales. Les images sont conservées et les polices remplacées par familles proches. Une page numérisée sans couche texte reste une image et exige une transcription pour bénéficier du changement de police. Les textes inclinés et mises en page complexes doivent être vérifiés dans l’aperçu ; aucune promesse de reproduction pixel par pixel.

Migration additive 0002 : reader_documents et reader_annotations ; les médias et tables existants sont préservés. Validation : 102 contrôles serveur en mémoire, contrôle TypeScript, conversion réelle dans le navigateur, navigation, taille, aperçu et composition en gras.


## Lecture immersive et extraits JYO

Par défaut, le lecteur affiche des pages logiques défilantes occupant presque tout l’écran. Les commandes et réglages se superposent et disparaissent ; seule une barre discrète reste en bas (progression du chapitre et du livre). Les pages texte suivent le repère administrateur et les limites des paragraphes ; les PDF gardent leur numérotation source. Modifier taille, police, interligne ou marges ne change pas ces pages. Le mode pages fixes reste disponible. La reprise conserve aussi le bloc de texte et sa position interne, dans les champs JSON existants.

La sélection propose marque-page, surlignages, favoris personnels et partage. Les favoris utilisent reader_annotations avec kind=favorite ; les anciens surlignages restent compatibles. Le partage crée un extrait vérifié de 3 à 500 caractères, une carte PNG JYO, une description sociale et un lien public /j/slug. Le lien d’un extrait gratuit ouvre le lecteur au passage partagé ; un contenu payant conserve sa page d’accès. Les autorisations Administration → Partage restent applicables : aucune activation implicite sur les œuvres existantes. Les visiteurs peuvent partager les extraits gratuits autorisés ; les extraits premium restent limités au texte approuvé. Retirer l’autorisation retire le lien et la génération de l’image (les plateformes externes peuvent conserver leur propre aperçu).

Contrôles : 114 vérifications serveur, rendu PNG réel, tests locaux de sélection, aperçu et copie du partage, lecture mobile et accès direct. Pas de nouvelle migration de données.

## Atelier simplifié et livre continu — version 7

L’entrée Administration → Livres regroupe le titre, l’écriture/collage enrichi, l’import PDF, l’aperçu réel et la publication du livre. L’adresse est générée automatiquement ; auteur prérempli, couverture importable et description facultative. Les brouillons acceptent un titre vide et sont enregistrés automatiquement. Une publication vérifie tous les chapitres de lecture avant de publier le livre et ces chapitres dans une transaction. Les livres déjà publiés demandent un enregistrement explicite pour les modifications. Les accès FREE/PREMIUM restent propres à chaque chapitre. Les anciens documents et outils de découpage/versionnement restent accessibles sous Outils avancés. Aucun contenu utilisateur n’est modifié par le déploiement.

L’import PDF sauvegarde l’original, prépare le document riche et affiche son aperçu dans BookReader. Des fragments contigus de texte sont regroupés visuellement en paragraphes pour la lecture adaptable, tout en conservant leurs identifiants de sélection et les coordonnées du mode fixe. Le téléchargement original demeure facultatif et soumis aux droits. Pas d’OCR : les scans sont signalés et nécessitent une transcription ; une conversion typographique complexe reste à vérifier.

Les chapitres TEXT/PDF partagent une navigation et une progression de lecture. Tourner la dernière page poursuit dans le même lecteur ; la première page permet de revenir au chapitre précédent. Le sommaire montre les chapitres, leur ordre et leurs restrictions. Le serveur ne fournit ni texte ni images réservés sans accès. Les anciennes URL par chapitre et de partage continuent de fonctionner. Une barre supérieure de 52 px montre livre et chapitre ; les réglages se referment, la progression reste en bas. Le pincement change la taille des caractères (14–36 px) en conservant le passage, avec boutons A−/A+ également disponibles.

Validation : 131 contrôles serveur en mémoire, conversion navigateur d’un PDF réel de trois pages, aperçu mobile 390×844, publication d’un texte via l’atelier, succession texte/PDF et arrêt à la limite premium. Gestes tactiles simulés : passage de 20 à 32 px puis à 19 px. Compilation et contrôle TypeScript requis avant publication. Aucune nouvelle migration.
