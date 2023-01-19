# Template pour création d'une librairie Node.js

Ceci est un gabarit pour démarrer un projet de librairie ("_`package npm`_") pouvant être déployée dans Nexus.

# Fournis dans ce gabarit

- Une structure et un fichier `tsconfig.ts` permettant de produire un `package npm` typé pouvant être publié dans Nexus.
- Des fichiers validant le lintage / coding standards.
- Un composant exemple "`src/exampleComponent.ts`" et son fichier de tests associés "`src/exampleComponent.test.ts`".
- Des tasks Gulp permettant de builder, lancer les tests et valider le lintage.
- Une fonction pour créer un logger bien configuré et gérant les Correlation Ids correctement : `src/utils/logger.ts`
- Des configurations et constantes : `src/config/configs.ts` et `src/config/constants.ts`

# Démarrer un projet à partir de ce gabarit

- Ajustez ce fichier `README.md` selon vos besoins.
- Mettre à jour les informations contenues dans le fichier `package.json`.
- Supprimez le "`exampleComponent`" et ajoutez les fichiers propres à votre librairie.

Finalement, n'oubliez pas d'ajouter votre librairie à cette page Confluence! :
[https://sticonfluence.interne.montreal.ca/display/AES/Catalogue+de+librairies+Typescript+internes](https://sticonfluence.interne.montreal.ca/display/AES/Catalogue+de+librairies+Typescript+internes)

# Configurations

Un code utilisant cette librarie doit premièrement la configurer en appellant la fonction
"`ìnit(...)`" exportée par le fichier "`src/config/init.ts`".

La configuration "`loggerCreator`" est _requise_ par cette librairie. Cela signifie qu'un code utilisant la librairie
(que ce soit du code d'un projet d'API ou d'une autre librairie) _doit_ setter cette configuration _avant_ que les composants
de la librairie ne soient utilisés.

Par exemple, dans un projet d'API basé sur le générateur
[generator-mtl-node-api](https://bitbucket.org/villemontreal/generator-mtl-node-api), ceci sera effectué dans le
fichier "`src/init.ts`", au début de la fonction `initComponents()` :

```typescript
import { init as initXXXXX } from '@villemontreal/votre-librairie-XXXXX-nodejs-lib';
import { createLogger } from './utils/logger';

// ...

export async function initComponents() {
  initXXXXX(createLogger);

  //...
}
```

Si vous configurez la librairie depuis _une autre librairie_, vous aurez à passer
le "`Logger Creator`" que vous aurez _vous-même_ reçu comme configurations! :

```typescript
import { init as initXXXXX } from '@villemontreal/votre-librairie-XXXXX-nodejs-lib';
import { configs } from './configs';

// ...

export async function initComponents() {
  initXXXXX(configs.loggerCreator);

  //...
}
```

Le but étant que toutes les librairies utilisées dans un projet d'API, ainsi que leurs propres librairies
transitives, puissent logger de la même manière et aient accès aux bons Correlation Ids.

Finalement, notez qu'une fonction "`isInited()`" est exportée et permet au code appelant de valider que la librairie a été
configurée correctement!

# Builder le projet

Les scripts `npm` sont des indirections vers des tasks Gulp définies dans le fichier "`gulpcore.ts`".
Vous pouvez lancer les tasks Gulp directement en ayant installé "`gulp-cli`" globalement :

> _`npm install -g gulp-cli`_

Pour lancer un build :

- > `npm start`
- > `npm test`
- > `gulp`
- > `gulp test`

Toutes ces commandes font la même chose : elles lancent la compilation (transpilation) des sources et roulent les tests.

# Publication du package npm sur Nexus

Dans le fichier `package.json` est définie, sous la clé "`publishConfig.registry`", l'URL de notre Nexus où publier le `package npm` résultant du projet buildé. Cela dit, cette publication ne devra probablement _pas_ se faire manuellement par un développeur : c'est Jenkins qui se chargera à la fois d'ajuster la version du package final (dans le fichier `package.json`) et de publier le tout dans Nexus.

# Comment faire une release

Voici le workflow de travail pour faire des PRs et des releases:

- Première release (**1.0.0**)
  - develop est à la version 1.0.0, master est vide
  - PR feature/addX -> develop
  - merged -> Jenkins publishes 1.0.0-pre.build.2
  - PR feature/addY -> develop
  - merged -> Jenkins publishes 1.0.0-pre.build.3
  - Time to release: npm run release
  - master contient la version 1.0.0, develop passe à la version 1.1.0
  - Jenkins publishes 1.0.0
- 2e release (**1.1.0**) incluant un bug fix
  - develop est à la version 1.1.0, master est à 1.0.0
  - PR feature/addZ -> develop
  - merged -> Jenkins publishes 1.1.0-pre.build.4
  - Bug fix pendant le développement de 1.1.0
    - create branch hotfix/1 depuis master
    - éditer package.json et mettre version = 1.0.1
    - PR hotfix/1 -> master
    - merged -> Jenkins publishes 1.0.1
    - Git tag master 1.0.1
    - PR hotfix/1 -> develop (resolve version conclict and keep latest version 1.1.0)
      - Ou bien merge master dans develop + push develop
    - Jenkins publishes 1.1.0-pre.build.5
  - PR feature/addQ -> develop
  - merged -> Jenkins publishes 1.1.0-pre.build.6
  - Time to release: npm run release
  - master contient la version 1.1.0, develop passe à la version 1.2.0
  - Jenkins publishes 1.1.0

Pour simplifier ces tâches, vous pouvez utiliser la commande "npm run release" qui fera automatiquement un pull, merge et incrément de version.
Par défaut la commande assume que la branche source est **develop** et que la branche destination est **master**. L'incrément par défaut est **minor**.

Notez que la branche master recevra la même version que celle de la branche source, et qu'on incrémentera ensuite la branche source, de façon à respecter le fait que la branche source (develop) doit être releasée en mode pre-release avant la version finale de la branche destination (master).
La version pré-release contiendra le numéro de build de Jenkins:

- '1.1.2-pre.build.15'
- '1.1.2-pre.build.16'
- '1.1.2'
- '1.1.3-pre.build.17'

Vous pouvez spécifier des valeurs différentes à l'aide des paramètres suivants:

- release-type: patch, minor, major, x.y.z (custom version)
- source-branch (develop)
- destination-branch (master)

Voici l'ordre d'exécution:

- switch to source branch (develop)
- git pull
- switch to destination branch (master)
- git pull
- merge source branch in fast forward mode
- read version from package.json
- tag version
- push tag
- push branch
- switch to source branch (develop)
- increment version
- push branch

Voici quelques variantes:

| Source branch | Source version | Dest branch   | Command                                               | Released version | Next version |
| ------------- | -------------- | ------------- | ----------------------------------------------------- | ---------------- | ------------ |
| develop       | 1.0.0          | master        | npm run release                                       | 1.0.0            | 1.1.0        |
| develop       | 1.0.0          | master        | npm run release -- --release-type=patch               | 1.0.0            | 1.0.1        |
| develop       | 1.0.0          | master        | npm run release -- --release-type=minor               | 1.0.0            | 1.1.0        |
| develop       | 1.0.0          | master        | npm run release -- --release-type=major               | 1.0.0            | 2.0.0        |
| develop       | 1.0.0          | master        | npm run release -- --release-type=2.3.4               | 1.0.0            | 2.4.3        |
| feature/foo   | 1.0.0          | master        | npm run release -- --source-branch=feature/foo        | 1.0.0            | 1.0.1        |
| develop       | 1.0.0          | release/1.0.0 | npm run release -- --destination-branch=release/1.0.0 | 1.0.0            | 1.0.1        |

# Tester une version beta d'une librairie, avant la publication dans Nexus

Voici comment tester une version _beta_ d'une librairie, avant d'en publier une version officielle.

Premièrement, notre Nexus actuel ne semble [pas gérer](https://stackoverflow.com/questions/48463911/nexus-3-do-not-support-npm-dist-tags-commands) les tags parfaitement,
ce qui enlève certaines possibilités qui auraient été intéressantes pour ces tests.

Deux solutions sont possibles:

1. Utiliser `npm link` ([article](https://medium.com/@the1mills/how-to-test-your-npm-module-without-publishing-it-every-5-minutes-1c4cb4b369be)).
   Cela dit, selon mes expériences, d'utiliser cette technique ne simule pas toujours parfaitement une librairie téléchargée depuis Nexus...

2. Pointer directement sur une branche sur BitBucket.

   Pour utiliser cette technique:

- La librairie doit contenir un script "_`prepare`_" appelant "_`gulp compile`_". Ce script est fourni dans ce gabarit.

- Créez une branche _`feature`_ pour les modifications à apporter à la librairie. Commiter et pusher ces modifications lorsqu'elles sont prêtes à
  être testées.

- Dans le projet duquel vous voulez vous servir pour tester la version beta de la librairie, vous lancez

  _`npm install @villemontreal/my-lib@git@bitbucket.org:villemontreal/my-lib.git#feature/some-required-modifications`_

  Où "_`feature/some-required-modifications`_" représente la branche à tester.

  Ceci va télécharger la librairie depuis BitBucket et va automatiquement appeller son script "`prepare`"!
  Ce script est requis car la version transpilée de la librairie _n'est pas commitée dans Git_, mais est requise au runtime.

- Il reste alors à tester la librairie!

- Lorsque vous apporter une nouvelle modification à la librairie en beta, vous la commitez, la pusher et relancer à nouveau, dans le projet
  servant à la tester:

  _`npm install @villemontreal/my-lib@git@bitbucket.org:villemontreal/my-lib.git#feature/some-required-modifications`_

- Lorsque la librairie est à votre goût, la merger jusque sur _`master`_, et vous assurez qu'elle est
  publiée sur Nexus. Vous pouvez fiinalement utiliser la nouvelle version stable dans vos projets.

# Scope des dépendances

**Attention!** Les dépendances de type "`@type`" devraient se trouver _dans le même scope_ que la dépendance à laquelle elles sont associées! Par exemple,
une dépendance régulière "`http-status-codes`" (qui n'est _pas_ une "devDependency") devra probablement avoir sa dépendance "`@type`" associée,
"`@types/http-status-codes`", également comme dépendance régulière, et non comme "devDependency"!

Ceci est le cas car c'est une _librairie_ que ce projet construit et cette librairie sera utilisée par un projet racine (un projet d'API par exemple).
Lorsque le projet racine compile, il semble que les librairies se trouvant dans son répertoire "`node_modules`" doivent avoir leurs "import" de disponibles
ou le projet racine lui-même ne compilera pas! J'ai tenté d'ajouter "`node_modules`" dans la section "`exclude`" du "`tsconfig.json`" du projet racine mais
sans succès... Il semble qu'il faille en tout temps que les "import" des fichiers `.ts` du projet, même ceux sous "`node_modules`", et même si "`node_modules`" est
exclu dans "`tsconfig.json`", puissent être "résolvés".

Voir [https://github.com/Microsoft/types-publisher/issues/81](https://github.com/Microsoft/types-publisher/issues/81) pour une discussion en partie à ce sujet.

Cela dit, ceci est à revalider dans le futur.

# Déboguer le projet

Trois "_launch configurations_" sont founies pour déboguer le projet dans VSCode :

- "`Debug all tests`", la launch configuration par défaut. Lance les tests en mode debug. Vous pouvez mettre
  des breakpoints et ils seront respectés.

- "`Debug a test file`". Lance _un_ fichier de tests en mode debug. Vous pouvez mettre
  des breakpoints et ils seront respectés. Pour changer le fichier de tests à être exécuté, vous devez modifier la ligne appropriée dans le fichier "`.vscode/launch.json`".

- "`Debug a Gulp task`". Lance une task Gulp en mode debug. Vous pouvez mettre
  des breakpoints et ils seront respectés. Pour changer la task exécutée, vous devez modifier la
  ligne appropriée dans le fichier "`.vscode/launch.json`".

# Aide / Contributions

Pour obtenir de l'aide avec ce gabarit, vous pouvez poster sur la chambre HipChat [dev-librairies-internes-nexus](https://villemontreal.hipchat.com/chat/room/4134541).

Notez que les contributions sous forme de pull requests sont bienvenues.

## Création de liaison pour le développement

Exécutez `npm run link-create` pour créer une liaison locale. (Vous pouvez l'exécuter qu'une seule fois).
Exécutez `npm run link-update` pour mettre à jour les sources liés.
