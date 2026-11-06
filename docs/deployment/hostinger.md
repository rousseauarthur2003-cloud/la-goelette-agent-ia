# Déploiement sur Hostinger (application Node.js)

## Pourquoi le site affichait une erreur 403

Deux causes cumulées :

1. **Le dépôt n'avait pas d'application** : seulement de la documentation, rangée dans un sous-dossier
   `la-goelette-github-starter (2)/la-goelette/`. Il n'y avait ni `package.json`, ni page d'accueil.
2. **Le déploiement n'était pas un déploiement Node.js** : les journaux montraient
   `Installing Composer dependencies` puis `Publishing`, c'est-à-dire le déploiement Git d'un **site web classique (PHP)**
   dans `public_html`. Aucun `npm install`, aucun `npm run build`, aucun serveur Node.js n'était lancé.

Le dépôt est désormais une application Next.js **à la racine**. Il faut aussi la déployer comme **application Node.js**.

## Prérequis

- Une offre Hostinger compatible avec les applications Node.js (selon Hostinger : Business Web Hosting ou offres Cloud).
- Le dépôt `rousseauarthur2003-cloud/la-goelette-agent-ia` sur GitHub, branche `main`.

## Étapes (hPanel)

Les intitulés peuvent légèrement varier selon l'offre ; les noms ci-dessous correspondent à la documentation Hostinger de novembre 2026.

1. **Sites web → Ajouter un site web → Application web Node.js** (« Node.js web app »).
2. **Importer un dépôt Git** → **Se connecter à GitHub** → autoriser l'application GitHub de Hostinger sur le dépôt `la-goelette-agent-ia`.
3. Vérifier les réglages détectés automatiquement :

   | Champ | Valeur |
   |---|---|
   | Framework | Next.js |
   | Branche | `main` |
   | Répertoire racine | `/` (laisser vide si le champ est vide par défaut) |
   | Version de Node.js | **22.x** (20.x convient aussi) |
   | Commande d'installation | `npm install` (puis `npm ci` une fois `package-lock.json` commité) |
   | Commande de build | `npm run build` |
   | Commande de démarrage | `npm run start` |
   | Répertoire de sortie | `.next` |

   Le serveur Next.js lit automatiquement la variable `PORT` fournie par Hostinger. Si l'écran propose une commande de
   démarrage explicite avec port, utiliser `npm run start -- -p $PORT`.
4. **Variables d'environnement** (facultatives pour la démonstration, recommandées dès la mise en ligne) :
   - `APP_MODE=demo`
   - `FOUNDER_PASSWORD=` votre mot de passe
   - `AUTH_SECRET=` une longue chaîne aléatoire (32 caractères ou plus)
   Ne jamais mettre de clé dans un fichier du dépôt.
5. **Déployer**. Le site est d'abord publié sur un sous-domaine temporaire.
6. **Domaine** : une application Node.js est créée comme un nouveau site ; rattachez ensuite votre domaine (ou un
   sous-domaine, par exemple `siege.votre-domaine.fr`) depuis le tableau de bord du site.
   Attention : si `restaurantlagoelette.fr` est votre site vitrine, utilisez plutôt un sous-domaine pour ne pas le remplacer.

## Vérifier que le déploiement a réellement fonctionné

Dans **Déploiements → détails / journaux de build**, vous devez voir :

- l'installation des dépendances npm (et non Composer) ;
- `next build` se terminer par la liste des routes (`Route (app)` …) sans erreur ;
- le démarrage du serveur (`next start`, « Ready »).

Puis ouvrez :

- `https://<votre-adresse>/api/health` → doit répondre `{"status":"ok", ...}` ;
- `https://<votre-adresse>/` → tableau de bord La Goélette ;
- `https://<votre-adresse>/siege` → carte 2D.

Un message « Publishing completed » seul ne prouve rien : seuls ces contrôles le prouvent.

## Mises à jour

Chaque `git push` sur `main` déclenche un nouveau déploiement. Les données en mémoire sont alors remises à zéro
(normal dans cette version).

## En cas d'échec

| Symptôme | Piste |
|---|---|
| Journaux « Composer » | Le site a été créé comme site web classique : recréer une **application Node.js** |
| `package.json` introuvable | Répertoire racine incorrect : mettre `/` |
| Erreur de build TypeScript | Lancer `npm run typecheck` en local et corriger ; voir `next.config.ts` |
| 503 / application arrêtée | Ouvrir les journaux d'exécution ; vérifier la version de Node (≥ 20.9) |
| Page blanche sur `/siege` | Ouvrir la console du navigateur ; la vue « Liste » reste disponible |
