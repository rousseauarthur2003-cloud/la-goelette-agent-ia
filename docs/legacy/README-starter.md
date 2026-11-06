# La Goélette — Virtual Headquarters

Prototype d'une entreprise virtuelle en pixel art 2D, inspirée des RPG Nintendo DS.

## Stack cible
- Next.js / React / TypeScript
- Phaser 3 pour la carte 2D
- PostgreSQL pour les données persistantes
- WebSockets pour les événements temps réel
- Backend d'orchestration IA à connecter ultérieurement

## Démarrage
Ce dépôt contient pour l'instant le squelette de dossiers et la documentation de conception.
Les dépendances et le code applicatif seront ajoutés lors de la première phase de développement.

## Structure
- `public/assets/` : graphismes, sprites, sons
- `public/maps/` : cartes et données de niveaux
- `src/app/` : routes Next.js
- `src/components/` : interface web
- `src/game/` : scènes et logique Phaser
- `src/features/` : domaines métier
- `src/lib/` : utilitaires et intégrations
- `src/types/` : types TypeScript partagés
- `docs/` : architecture, design et spécifications

## Important
Ne placez jamais de clés API, mots de passe ou secrets dans Git.
