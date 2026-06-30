# Guide de contribution — UnRobot

Merci de vouloir contribuer à UnRobot. Ce document décrit comment configurer
l'environnement et soumettre vos changements.

## Prérequis
- Node.js 20+
- npm (gestionnaire de paquets du projet, voir `package-lock.json`)

## Installation
```bash
git clone <url-du-dépôt>
cd project
npm install
npm run dev
```

## Scripts utiles
| Commande | Description |
| :--- | :--- |
| `npm run dev` | Lance le serveur de développement Vite |
| `npm run build` | Build de production |
| `npm run lint` | Vérifie le code avec ESLint |
| `npm run preview` | Prévisualise le build de production |

## Conventions de code
- TypeScript strict, composants React fonctionnels.
- Toute couleur passe par les tokens sémantiques de `src/index.css` (pas de couleurs en dur).
- Le traitement de texte reste 100% local (aucune API externe).
- Pas de tiret cadratin dans l'UI, utiliser le trait d'union simple.

## Pull requests
1. Créez une branche dédiée (`feat/...`, `fix/...`).
2. Assurez-vous que `npm run lint` et `npm run build` passent.
3. Décrivez clairement le changement et son impact.