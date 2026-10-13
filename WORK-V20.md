# JYO — Trois blocs UX et temps de lecture

## Continuité
Versions 18 (accueil compact, bibliothèque privée en étagères et disposition au choix) et 19 (navigation persistante) publiées séparément le 13 octobre 2026. La version 20 ajoute le temps de lecture. PDF, comptes, achats, contenus et historique de progression conservés. Aucune conversion PDF serveur ajoutée.

## Temps de lecture
Compteur actif au premier plan, silencieux pour les visiteurs et les comptes gratuits/Classique. Pause automatique quand la page est masquée, perd le focus, présente un panneau bloquant ou reste inactive. Seuil texte de 2 à 5 minutes selon la longueur affichée. Audio/vidéo comptés pendant la lecture effective au premier plan, hors pause et déplacement de position. Le navigateur ne garantit pas un suivi écran éteint ; aucune durée d’arrière-plan n’est inventée.

Stockage local avant synchronisation toutes les 15 secondes, au retour en ligne et à la sortie. Chaque minute utilise un masque texte de 60 bits ; union SQL et agrégation avant filtrage pour éviter les doublons entre onglets, appareils et formats. File séparée par propriétaire et refus serveur si le compte change. Les visiteurs conservent leur temps uniquement sur l’appareil. Statistiques sur les 31 derniers jours, filtres livre/format/période, détail accessible par jour, temps automatique et manuel séparés.

Premium : engagement quotidien ou hebdomadaire, gestion pause/reprise/arrêt, saisie hors application idempotente, badges. Une reprise démarre un nouveau cycle ; historique conservé. Saisie manuelle plafonnée à 24 h/jour et sans aucun effet sur les pages. Les engagements Classique existants sont maintenus jusqu’à leur échéance originale par la migration 0005, sans extension possible hors Premium.

## Vérifications
279 contrôles serveur en SQLite mémoire : régressions existantes, droits, isolation, précision 60 bits, doublons, limites, engagements et conservation des acquis. TypeScript sans erreur. Parcours navigateur sur fixtures locales, notamment engagement et saisie manuelle, cumul et affichage à 390 × 844. Aucun paiement ni contenu réel utilisé pour les tests.

## Limites
Pas de reconstitution des heures antérieures à cette version. Les heures sont une estimation d’activité et ne prouvent pas la compréhension du texte. La fenêtre de statistiques montre les 31 derniers jours ; les données antérieures restent stockées. L’accès à une page complètement hors connexion dépend du cache existant du lecteur.
