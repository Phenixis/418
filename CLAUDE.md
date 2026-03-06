# Instructions pour Claude

Ce projet suit des conventions de nommage strictes. Respecte-les systématiquement dans tout le code que tu génères ou suggères.

---

## 1. Variables et Attributs de classe

Privilégie la clarté sur la concision. Le nom doit décrire le **contenu** ou la **raison d'être**.

| Type | Convention | Exemple |
| :--- | :--- | :--- |
| **Variables standards** | `camelCase` | `const userData = ...` |
| **Constantes globales** | `UPPER_SNAKE_CASE` | `const API_RETRY_LIMIT = 3` |
| **Variables booléennes** | Préfixe (`is`, `has`, `should`) | `const isActive = true` |
| **Attributs de classe** | `camelCase` | `this.userName = name` |
| **Attributs privés** | Préfixe `_` | `this._internalId = id` |

- Évite les abréviations obscures. `user` est préférable à `u`, `index` à `i` (sauf pour les compteurs de boucles simples).
- Utilise le pluriel pour les collections (`users`) et le singulier pour les entités uniques (`user`).

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
