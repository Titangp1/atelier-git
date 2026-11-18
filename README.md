# Atelier Git

Apprendre Git en tapant de vraies commandes, dans un terminal simulé directement dans le navigateur.
Réalisé par **Titan_gp1**.

**Essayer en ligne : https://titangp1.github.io/atelier-git/**

Version actuelle : **1.3.0**

## Ce que contient l'atelier

- **11 leçons guidées**, chacune avec une explication courte et des missions qui se valident toutes seules :
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

## Lancer en local

Tout tient dans `index.html` : double-cliquez dessus, il s'ouvre dans votre navigateur.
Aucune installation n'est nécessaire. Seules les polices viennent d'Internet ; hors ligne, des polices système les remplacent.

## Commandes simulées

`init` `clone` `config` (alias compris) `status` `add` `rm` `mv` `commit` `restore` `reset` `clean` `log`
(`--oneline`, `--all`, `--follow`, `-G`, `--stat`) `show` `diff` `blame` `reflog` `branch` `switch` `checkout`
`merge` (`--squash`, `--abort`) `rebase` `cherry-pick` `revert` `stash` `tag` `remote` `push`
(`-u`, `--force-with-lease`, `--tags`) `fetch` `pull` (`--rebase`), ainsi que `.gitignore`.

Les modes interactifs (`git add -p`, `git rebase -i`) ne sont pas simulés : l'atelier explique ce qu'ils font.

## Historique des versions

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
