# Inutile donc indispensable

Site minimaliste qui affiche chaque jour une blague et une information inutile, avec deux modes : Grand public et Mode Dev 🤓.

## Stack

- Next.js 14 (App Router) + TypeScript
- Firestore (Firebase Admin SDK côté serveur uniquement)
- OpenAI API
- Vercel + Cron

## Setup

### 1. Installation

```bash
npm install
```

### 2. Variables d'environnement

Créer un fichier `.env.local` à la racine du projet :

```env
OPENAI_API_KEY=sk-...
FIREBASE_PROJECT_ID=inutile-177ac
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@inutile-177ac.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
CRON_SECRET=un-secret-aleatoire-tres-long
```

**Important** : `FIREBASE_PRIVATE_KEY` doit être entre guillemets et les `\n` doivent être présents (ils seront automatiquement convertis).

### 3. Configuration Firebase

1. Aller dans [Firebase Console](https://console.firebase.google.com/)
2. Sélectionner le projet `inutile-177ac`
3. Paramètres du projet → Comptes de service
4. Générer une nouvelle clé privée
5. Télécharger le JSON et extraire `client_email` et `private_key`

### 4. Lancer en développement

```bash
npm run dev
```

Le site sera accessible sur [http://localhost:3000](http://localhost:3000)

## Test de l'API Cron

Pour tester manuellement l'endpoint de génération :

```bash
curl -X POST http://localhost:3000/api/cron/generate \
  -H "X-CRON-SECRET: votre-cron-secret"
```

Réponse attendue :
```json
{
  "success": true,
  "date": "2026-01-24",
  "results": {
    "general": { "id": "2026-01-24_general", "created": true },
    "dev": { "id": "2026-01-24_dev", "created": true }
  }
}
```

## Configuration Vercel Cron

### 1. Créer un fichier `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/generate",
      "schedule": "5 0 * * *"
    }
  ]
}
```

**Note** : `5 0 * * *` = 00:05 UTC (soit 01:05 ou 02:05 selon l'heure d'été/hiver en Europe/Paris). Pour être précis à 00:05 Europe/Paris, utilisez une expression cron adaptée ou un service externe.

### 2. Variables d'environnement sur Vercel

Ajouter toutes les variables d'environnement dans les paramètres du projet Vercel :
- `OPENAI_API_KEY`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` (avec les `\n` présents)
- `CRON_SECRET`

### 3. Header personnalisé pour le Cron

Dans les paramètres du Cron Vercel, ajouter un header personnalisé :
- **Name** : `X-CRON-SECRET`
- **Value** : la valeur de `CRON_SECRET`

**Alternative** : Vercel ajoute automatiquement un header `x-vercel-signature` pour les crons. Vous pouvez aussi utiliser ce header pour la validation si vous préférez.

## Structure Firestore

**Collection** : `daily`

**Document ID** : `${YYYY-MM-DD}_${mode}` où `mode` = `general` ou `dev`

**Champs** :
- `date` (string) : Date au format YYYY-MM-DD
- `mode` (string) : `general` ou `dev`
- `joke` (string) : La blague
- `fact` (string) : L'information inutile
- `sourceUrl` (string) : URL source de l'information
- `createdAt` (timestamp) : Date de création

## Déploiement

```bash
vercel
```

Ou via GitHub : connecter le repo à Vercel pour un déploiement automatique.
