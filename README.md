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

