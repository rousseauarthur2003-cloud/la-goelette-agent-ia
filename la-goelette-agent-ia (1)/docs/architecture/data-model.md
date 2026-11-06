# Architecture et modèle de données (version 0.1)

## Couches

1. **Interface Next.js** (`src/app`, `src/components`) : pages rendues côté serveur à chaque requête ; composants client pour les formulaires, filtres, CEO et siège.
2. **Siège 2D** (`src/game`) : carte générée de façon déterministe (`buildMap`), pixel art dessiné par code, scène Phaser chargée uniquement dans le navigateur. Les pages de gestion n'en dépendent pas.
3. **Domaine** (`src/lib`) : organigramme (source unique), calcul des états de poste.
4. **Serveur** (`src/server`) : stockage, authentification, CEO, fournisseurs IA.
5. **Temps réel** : polling (`/api/state` toutes les 10 s dans le siège, rafraîchissement 20 s du tableau de bord). Aucun WebSocket requis.

## Distinctions fondamentales

- **Poste** (`Position`) : prévu dans l'organigramme, 50 au total, permanent.
- **Agent** (`Agent`) : logiciel affecté à un poste ; `status` et `connection_status` déclarés.
- **Exécution** (`Execution`) : travail réel en cours sur une mission, avec heartbeat. Seule source de l'état `working`.

## Provenance (Annexe B)

Chaque agent, mission, validation et événement porte `provenance` : `real`, `computed`, `demo` ou `estimate`.
L'interface affiche « Démonstration » pour les données fictives.

## Persistance

Version actuelle : **mémoire du processus** (`src/server/store.ts`), non persistante.
Cible : PostgreSQL avec le schéma `db/schema.sql`. Les fonctions du module `store` constituent l'interface à réimplémenter
(dépôt PostgreSQL) sans changer les pages ni les routes. Sauvegardes à prévoir dès l'activation d'une vraie base.

## Transitions de mission

`in_progress` n'est jamais posé à la main : il résulte d'un démarrage d'exécution par un agent.
Le fondateur peut : brouillon ↔ en attente → affectée → terminée / en erreur, et annuler.
Une demande de validation bloque l'exécution jusqu'à la décision du fondateur.
