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
