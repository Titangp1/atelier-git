# Atelier Git

Apprendre Git en tapant de vraies commandes, dans un terminal simulé directement dans le navigateur.
Réalisé par **Titan_gp1**.

**Essayer en ligne : https://titangp1.github.io/atelier-git/**

Version actuelle : **2.2.0**

## Ce que contient l'atelier

- **15 leçons guidées**, chacune avec une explication courte et des missions qui se valident toutes seules :
  premier dépôt, les trois zones, l'historique, les branches, la fusion, les conflits, le travail à plusieurs,
  le stash, le rebase, `.gitignore` et l'enquête (`log`, `blame`), réparer ses erreurs (`amend`, `reflog`, `cherry-pick`).
- **Un bac à sable** pour tout essayer librement, avec un dépôt de démonstration à cloner.
- **Un terminal simulé** qui répond avec les vrais messages de Git, et des astuces en français en cas d'erreur.
- **Un graphe des commits** dessiné en direct, et les trois zones de Git (répertoire de travail, index, dépôt).
- **Un aide-mémoire** organisé comme [l'aide-mémoire officiel de Git](https://git-scm.com/cheat-sheet).
- Des points d'expérience, la progression gardée dans le navigateur, un thème clair et sombre.

Raccourcis : `/` pour revenir au terminal, `↑` `↓` pour l'historique des commandes, `Tab` pour compléter.

Le bouton **Effets** règle le verre liquide : *légers* (le plus rapide), *équilibrés* (par défaut) ou *maximum*.
Si la page saccade, l'atelier passe tout seul en effets légers.

Le copier-coller est désactivé et rien ne s'écrit tout seul dans le terminal : les commandes s'apprennent en les tapant. Un indice se dévoile à la demande si vous bloquez. Dans le terminal, `Ctrl+C` annule la ligne en cours, comme dans un vrai shell.

## Les pages du site

| Page | Fichier | Contenu |
|---|---|---|
| Accueil | `index.html` | Présentation, démo animée, votre progression, le parcours des 15 leçons |
| Atelier | `atelier.html` | Les leçons, le terminal simulé, le graphe et les trois zones. Chaque leçon a son adresse, par exemple `atelier.html#branches` |
| Tuto GitHub | `github.html` | Tutoriel réel : compte, installation, connexion, premier push, erreurs fréquentes |
| Aide-mémoire | `aide-memoire.html` | Toutes les commandes, avec une recherche |
| Défis | `defis.html` | Onze défis de Facile à Expert (30 à 150 XP) : un objectif, aucune commande imposée |
| Classement | `classement.html` | Les joueurs rangés par XP, avec votre rang |
| Compte | `compte.html` | Inscription, connexion, pseudo, suppression du compte |
| À propos | `a-propos.html` | Crédits, historique des versions, code source |

Le dossier `assets/` contient le style commun (`style.css`), le code partagé par toutes les pages (`site.js`),
le moteur Git et les leçons (`atelier.js`) et le code de l'accueil et de l'aide-mémoire (`pages.js`).

## Lancer en local

Double-cliquez sur `index.html` : le site s'ouvre dans votre navigateur, sans installation.
Seules les polices viennent d'Internet ; hors ligne, des polices système les remplacent.

## Comptes et classement

Les comptes et le classement passent par [Firebase](https://firebase.google.com) (offre gratuite Spark) :
*Authentication* pour les comptes (email et mot de passe, ou Google) et *Firestore* pour les profils du classement.
Le site reste statique. Tant que `assets/config.js` est vide, il fonctionne normalement, sans compte.

Mise en place, dans la [console Firebase](https://console.firebase.google.com) :

1. Créer un projet, puis y ajouter une application **Web** et copier son objet `firebaseConfig`.
2. *Authentication → Sign-in method* : activer **Adresse e-mail/Mot de passe** et **Google**.
3. *Authentication → Paramètres → Domaines autorisés* : ajouter `titangp1.github.io`.
4. *Firestore Database* : créer la base en mode production (région `europe-west`).
5. *Firestore → Règles* : coller le contenu de `firebase/firestore.rules`, puis publier.
6. Coller l'objet `firebaseConfig` dans `assets/config.js`, à la place de `null`.

Sécurité : la configuration Web de Firebase est publique par conception. Les règles Firestore vérifient chaque écriture :
chacun ne modifie que son propre profil, les XP doivent correspondre exactement aux leçons et défis réussis (2100 XP au maximum),
ces listes ne peuvent que grandir et chaque pseudo est unique. Après chaque modification de `firebase/firestore.rules`,
il faut recoller le fichier dans *Firestore → Règles* et publier. Aucun email n'est stocké dans le classement.

## Commandes simulées

`init` `clone` `config` (alias compris) `status` `add` `rm` `mv` `commit` `restore` `reset` `clean` `log`
(`--oneline`, `--all`, `--follow`, `-G`, `--stat`) `show` `diff` `blame` `reflog` `branch` `switch` `checkout`
`merge` (`--squash`, `--abort`) `rebase` `cherry-pick` `revert` `stash` `tag` `remote` `push`
(`-u`, `--force-with-lease`, `--tags`) `fetch` `pull` (`--rebase`), ainsi que `.gitignore`.

Les modes interactifs (`git add -p`, `git rebase -i`) ne sont pas simulés : l'atelier explique ce qu'ils font.

## Historique des versions

- **v2.3.0** : page Tuto GitHub ; 4 leçons (Configurer Git, Renommer et supprimer, Versions et annulation, Publier sur GitHub) ; 6 défis (17 au total) ; panneau Options. Règles Firestore mises à jour.

### 2.2.0

- Onze **défis** de Facile à Expert, de 30 à 150 XP chacun : un dépôt préparé, un objectif, un indice et un chronomètre,
  mais aucune commande imposée. Ils se jouent dans l'atelier (onglet « Défis ») et ont leur propre page.
- Le classement compte les défis (2100 XP au total) et affiche une colonne Défis.
- Le nombre de joueurs inscrits s'affiche dans le pied de page de toutes les pages et sur l'accueil.
- Animations : transitions entre les pages, apparition des sections au défilement, chiffres qui défilent,
  confettis à chaque réussite, « +XP » qui s'envole, lignes du classement en cascade.
- Règles Firestore mises à jour pour vérifier les XP des défis : à republier dans la console Firebase.

### 2.1.0

- Comptes : inscription avec un pseudo, connexion, changement de pseudo, suppression du compte.
- Page Classement : les joueurs rangés par XP, médailles pour le podium, votre rang en tête de page.
- La progression suit le compte : une leçon terminée sur un appareil apparaît sur les autres.
- Connexion par email ou avec Google, mot de passe oublié, choix du pseudo à la première connexion Google.
- Les règles Firestore vérifient les XP ; les formulaires de compte acceptent le collage (gestionnaires de mots de passe).

### 2.0.0

- Le site passe en quatre pages : Accueil, Atelier, Aide-mémoire et À propos, avec une navigation commune.
- Plus aucune commande ne s'écrit toute seule : les indices se dévoilent à la demande et se tapent à la main,
  l'aide-mémoire et le graphe n'insèrent plus rien.
- Effets maximum fiabilisés : flou plus fort et reflet qui suit la souris. La réfraction SVG des grands panneaux,
  qui provoquait des défauts d'affichage, est retirée.
- L'écran de chargement ne s'affiche qu'une fois par visite.
- Chaque leçon a sa propre adresse (`atelier.html#branches`), et l'accueil propose de reprendre là où vous en étiez.

### 1.4.0

- Écran de chargement au démarrage : un petit graphe de commits se dessine pendant que l'atelier se prépare.
  Il disparaît en fondu dès que tout est prêt, et au plus tard après 7 secondes.
- Copier-coller désactivé (raccourcis clavier, clic droit, glisser-déposer) avec un message qui invite à taper la commande.
  Le texte de la page n'est plus sélectionnable ; les champs de saisie restent éditables.
- `Ctrl+C` dans le terminal annule la ligne en cours et affiche `^C`, comme dans un vrai shell.

### 1.3.0

- Corrigé : la page ramait. L'anneau du commit actuel tournait sans arrêt et forçait le recalcul du verre à chaque image ;
  la réfraction de tous les panneaux était recalculée à chaque défilement et après presque chaque commande.
- Nouveau bouton « Effets » : légers, équilibrés (par défaut, réfraction sur la barre du haut seulement) ou maximum.
  Passage automatique en effets légers si le défilement saccade.
- Frappe fluide façon macOS : le curseur glisse d'une lettre à l'autre, chaque lettre apparaît en douceur,
  et les commandes insérées s'écrivent lettre par lettre. Les réponses du terminal arrivent en fondu.
- Le terminal garde au plus 700 lignes, pour rester rapide pendant les longues sessions.

### 1.2.0

- 2 nouvelles leçons : « Ignorer et enquêter » et « Réparer ses erreurs ».
- `.gitignore` pris en compte par `status`, `add` et `clean`, avec un badge « ignoré » dans les zones.
- Nouvelles commandes : `git mv`, `git clean`, `git reflog` (et `HEAD@{n}`), `git blame`, `git cherry-pick`,
  `git merge --squash`, `git pull --rebase`, `git push --force-with-lease` et `--tags`, les alias Git.
- Nouvelles options : `git log <fichier>`, `--follow`, `-G`, `git log main`, `git diff HEAD`,
  `git diff <commit> <fichier>`, `--stat`, `git restore --source` et `--worktree`, `git checkout <commit> <fichier>`,
  `git status -s` et `--ignored`, `git branch --sort`, `git config --list`, `cat .git/config`.
- `git commit` sans `-m` ouvre un éditeur pour le message, comme le vrai Git.
- `git status` détecte les renommages.
- Aide-mémoire réorganisé comme l'aide-mémoire officiel, avec la façon de désigner un commit.

### 1.1.0

- Corrigé : l'aide-mémoire et l'éditeur s'affichaient au démarrage et le bouton « Fermer » ne répondait pas.
- Corrigé : la page s'affichait en mode de compatibilité quand on l'ouvrait depuis le disque.
- Corrigé : `git reset HEAD <fichier>` désindexait tous les fichiers ; les étiquettes du premier commit étaient
  coupées dans le graphe ; plusieurs petits défauts du terminal.
- Accessibilité : la touche Tab ne reste plus bloquée ; les fenêtres gèrent le focus clavier.
- Interface : vraie réfraction du verre liquide sur les panneaux (navigateurs Chromium), légende des badges,
  commits cliquables dans le graphe, réinitialisation de la progression.

### 1.0.0

- Première version : 9 leçons, bac à sable, terminal simulé, graphe des commits, interface en verre liquide.

## Crédits

Conçu et réalisé par **Titan_gp1**.

La réfraction du verre est portée de [liquid-glass-js](https://github.com/dashersw/liquid-glass-js)
(© 2025 Armagan Amcalar, licence MIT).
