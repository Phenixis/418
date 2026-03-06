# 418 - Application de gestion d'absence

## Installation

### 1. Installer NodeJS

#### Windows

Sous windows, le plus simple est d'utiliser l'installateur MSI disponible juste [ici](https://nodejs.org/fr/download). Vous pouvez ensuite run l'installateur.

#### Linux

Sous Linux, le plus simple est d'utilisé NVM (Node Version Manager), qui est un utilitaire pour gérer les versions de Node.

1. Installez NVM :

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
```

2. Rechargez le terminal, et installez la dernière version stable :

```bash
source ~/.bashrc
nvm install --lts
```

3. Si vous avez plusieurs versions installées, assurez-vous d'utiliser la dernière version stable par défaut :

```bash
nvm alias default lts/*
```

4. Vérifiez l'installation

```bash
nvm -v
node -v
npm -v
```

### 2. Installer PNPM

Initialement, node utilise NPM (Node Package Manager) pour installer les packages (en gros c'est des plugins qui ajoutent des fonctionnalités, etc.) nécessaires pour lancer des applications.

Le problème avec NPM est qu'il n'est pas optimal, il peut facilement rendre l'application très lente. Donc, on va utiliser PNPM (Performant NPM). Pour l'installer, lancez la commande suivante:

```bash
npm add -g pnpm
```

### 3. Cloner le dépôt github

```bash
git clone https://github.com/Phenixis/418
```

### 4. Installer les packages

```bash
pnpm install
```

### 5. Lancez le server de dev

```bash
pnpm dev
```

Open [http://localhost:3005](http://localhost:3005).

## Utils

### Run the development server

```bash
pnpm dev
```

Open [http://localhost:3005](http://localhost:3005).

---

# 📝 Conventions de Nommage

Ce document définit les standards de nommage pour assurer la cohérence et la maintenabilité du code au sein du projet.

---

## 1. Variables et Attributs de classe

On privilégie la clarté sur la concision. Le nom doit décrire le **contenu** ou la **raison d'être**.

| Type | Convention | Exemple |
| :--- | :--- | :--- |
| **Variables standards** | `camelCase` | `const userData = ...` |
| **Constantes globales** | `UPPER_SNAKE_CASE` | `const API_RETRY_LIMIT = 3` |
| **Variables booléennes** | Préfixe (`is`, `has`, `should`) | `const isActive = true` |
| **Attributs de classe** | `camelCase` | `this.userName = name` |
| **Attributs privés** | Préfixe `_` | `this._internalId = id` |

> **Note :** Évitez les abréviations obscures. `user` est préférable à `u`, `index` à `i` (sauf pour les compteurs de boucles simples).

> **Note² :** Utilisez le pluriel pour les collections (`users`) et le singulier pour les entités uniques (`user`).

---

## 2. Fonctions et Méthodes

Les noms doivent impérativement commencer par un **verbe** pour indiquer une action.

- **Général :** `camelCase`.
- **Gestionnaires d'événements (Handlers) :** Utiliser le préfixe `handle` suivi de l'événement.
  - *Exemple :* `handleClick`, `handleSubmit`.
- **Propriétés d'événements (Props) :** Utiliser le préfixe `on`.
  - *Exemple :* `<Button onClick={handleClick} />`.

---

## 3. Fichiers et Dossiers

### Composants React (`.tsx`)
Utiliser le **PascalCase**. Cela permet de distinguer visuellement les composants des fonctions utilitaires.
- ✅ `UserCard.tsx`, `Navbar.tsx`

### Fichiers non-composants (`.ts`, `.js`)
Utiliser le **kebab-case** (minuscules séparées par des tirets).
- ✅ `auth-utils.ts`, `api-client.ts`, `use-local-storage.ts` (hooks).

### Architecture des dossiers
- **Dossiers de fonctionnalités :** `kebab-case`.
- **Routage (App Router) :** Les noms réservés par Next.js doivent rester en minuscules (`page.tsx`, `layout.tsx`). Pour les dossiers de segments de route : `kebab-case`.
  - *Exemple :* `app/user-profile/[user-id]/page.tsx`

---

## 4. Résumé

| Catégorie | Style | Exemple |
| :--- | :--- | :--- |
| **Composants React** | `PascalCase` | `UserProfile.tsx` |
| **Fichiers / Dossiers** | `kebab-case` | `auth-utils.ts`, `/api-routes/` |
| **Hooks personnalisés** | `camelCase` (prefix `use`) | `useLocalStorage.ts` |
| **Styles (Modules)** | `PascalCase.module.css` | `Navbar.module.css` |
| **Types / Interfaces** | `PascalCase` | `UserSession.ts` |
| **Variables / Attributs** | `camelCase` | `const userAge = 25;` |
| **Fonctions / Méthodes** | `camelCase` (verbe) | `const fetchData = () => {}` |
| **Constantes globales** | `UPPER_SNAKE_CASE` | `const MAX_TIMEOUT = 5000;` |
| **Attributs privés** | `_camelCase` ou `#camelCase` | `this._internalId = 123;` |
| **Booléens** | `is / has / should` | `const isValid = true;` |
