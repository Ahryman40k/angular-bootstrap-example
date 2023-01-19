# AGIR - Planif

# Informations de développement

## Livraison de l'environnement de formation

Commande pour créer une branche de formation
```
git checkout -b release/2.3.2-training
```
### URL de l'environnement de formation

### Fichiers de configuration
L'environnement de formation est défini dans le fichier acceptation-training.yaml

On y retrouve les informations spécifiques à l'environnement de formation. Le reste de 
la configuration est basé sur le fichier acceptation.yaml

### Jenkinsfile
Configuration des secrets dans Jenkins: 
agirworkplanning-bd-ACCEPT-training
agirworkplanning-srvacc-ACCEPT-training
agirworkplanning-oidc-ACCEPT-training

### Base de données
Base de données: Il y a une base de données propre à l'environnement de formation

Le nom de cette BD dans l'environnement d'acceptation est : agirworkplanningtraining

Pour le moment, le script de migration de BD ne permet de faire des backup/restore sur l'environnement de formation. Des démarches sont faites pour que ça soit corrigé.

### Autres API

DCI: Environnement de formation: ACCEPT

## Configuration suggérée pour travailler avec [_VSCode_](https://code.visualstudio.com/)

Utilisez les fichiers sous `/.local/vscode_suggested_settings`. Vous pouvez tout simplement
copier le répertoire "`.vscode`" fourni à la racine du projet... C'est en fait ce que nous recommendons
de faire _avant toute chose_! Plusieurs parties de la documentation considère que ces configs
sont actives.

Installez l'extension [Prettier](https://prettier.io) pour
VSCode (`[CTRL]-[P]` + "`ext install prettier-vscode`").  
Cette extension appliquera les règles de formattage.

Installez aussi l'extension `TSLint` (`[CTRL]-[P]` + "`ext install tslint`").

---

## Configuration obligatoire, peu importe l'éditeur

Assurez-vous que les règles [Prettier](https://prettier.io), telles qu'mportées par le fichier
`prettier.config.js` soient appliquées.

* Les sauts de ligne sont standardisés à "`\n`". Pas de "`\r\n`".
* Tous les fichiers doivent être encodés en `UTF-8` (sauf exception justifiable).
* L'indentation est de `2 espaces`, aucune tabulation.
* Autrement, les règles TSLint doivent être celles telles qu'mportées par le fichier
  `tslint.json`.

---

## Configuration variée

### Git - autocrlf

Selon la manière dont vous avez installé Git sur votre poste, il est possible qu'une
certaine configuration soit désagréable : la configuration "`core.autocrlf`" dit à Git s'il doit
modifier ou non les sauts de ligne d'un projet lors d'un clone. Si votre config est à `true`, et
que vous êtes sur Windows, chaque fichier d'un projet cloné et basé sur ce gabarit aura ses sauts de ligne
convertis à `\r\n` automatiquement... Mais lorsque ces fichiers seront par la suite ouverts dans VSCode, ils seront
automatiquement _re-modifiés_ à `\n` par VSCode (car c'est le standard désiré et configuré)!
Bref, sans même que vous ayez apporté des modifications volontairement, un fichier ouvert sera modifié et il vous
sera demandé si vous désirez le sauvegarder! Pour cette raison, nous recommendons de mettre cette
configuration Git à `false` :

_`git config --global core.autocrlf false`_

Si vous changez cette configuration tel que suggéré, vous devrez _re-cloner_ le projet car les sauts de ligne
auront déjà été modifiés par Git.

### Longueur des chemins de fichiers sur Windows

Sur Windows, les fichiers avec des paths trop longs peuvent être problématiques. Voici les deux choses à faire pour
régler le problème :

* Activer la configuration "_core.longpaths_" dans Git :  
  _`git config --global --add core.longpaths true`_

* Avec Windows 10 (règle le problème pour de bon pour Windows) :  
  [Activer les chemins long](https://www.google.com/?gfe_rd=cr&gws_rd=ssl,cr&fg=1#q=windows+10+enable+long+paths)

### Npm

Nous suggérons également que toutes les dépendances ajoutées au fichier `package.json` aient _une version fixe_. Par
exemple, utiliser _`"knex": "0.12.6"`_ et non _`"knex": "~0.12.6"`_ ou `"knex": "^0.12.6"`. Pour que les versions des dépendances
soient non variables par défaut, il est possible de configurer `npm` globalement avec cette commande :

_`npm config set save-prefix=`_

Les dépendances installées par la suite seront à une version fixe, et n'auront pas "`~`" ou "`^`" comme préfix.

Il est aussi fortement recommandé d'utiliser une version récente de `npm`, qui génère maintenant un fichier
"`package-lock.json`" permettant de valider correctement les versions des dépendances, transitives ou non.

---

## Comment lancer l'application en développement

Trois méthodes sont possibles pour développer l'application en local : _nativement_, en _mode watch_ ou _dans Docker_.

De lancer l'application nativement offre de meilleures performances qu'avec Docker, offre une expérience de travail
légèrement plus agréable, mais demande d'installer des composants natifs supplémentaires sur le poste de travail si le support pour Oracle
est requis. La solution avec Docker ne demande uniquement qu'un poste où `Node` est installé. Notez que pour faire évoluer le
_gabarit lui-même_, pour y contribuer, le support pour Oracle est requis.

### **Nativement** :

* Si le support pour Oracle est requis, installez les dépendances locales requises (voir [section](#markdown-header-oracle-introduction) plus bas).
* Lancez "_`npm install`_" à la racine du projet.

  Puis...

  _Avec VSCode:_

  * Sélectionnez la "launch configuration "`Debug locally`" si elle ne l'est pas déjà (c'est la configuration par défaut) et appuyez sur "`[F5]`".

  _En ligne de commande:_

  * Lancez "`npm start`" ou "`gulp start`" pour démarrer l'application.

Notez qu'avec cette méthode vous devez relancer l'application après chaque modification et une recompilation complète
sera effectuée, ce qui peut prendre du temps si votre application possède beaucoup de fichiers.

### **Mode watch** :

* Si le support pour Oracle est requis, installez les dépendances locales requises (voir [section](#markdown-header-oracle-introduction) plus bas).
* Dans un terminal *séparé* (idéalement externe à VS Code) lancer "`npm run watch`" ou "`gulp watch`". Ceci va lancer une recompilation complète mais va par la suite demeurer
  en attente de nouvelle modifications pour recompiler de manière *incrémentale* (très rapide!).

Puis, dans VSCode:

  * Sélectionnez la "launch configuration "`Debug locally - fast`" si elle ne l'est pas déjà et appuyez sur "`[F5]`".
    Ceci va lancer l'application dans VS Code en mode debug *sans recompilation* et *sans validation*. Bref, l'application va démarrer beaucoup plus rapidement
    qu'avec un "`Debug locally`" régulier!

  Avec cette méthode, lorsqu'une modification est effectuée, le processus "*watch*" qui roule dans un terminal dédié va recompiler incrémentalement l'application. Vous pouvez alors relancer l'application avec `CTRL-SHIFT-F5` et l'application sera redémarrée rapidement avec les nouveaux changements actifs.

  Vous pouvez activer une notification visuelle lorsque la compilation incrémentale est terminée, en utilisant la config "`debug.watch.notifications.enabled`".
  Notez que sur Windows 10, il est possible que vous deviez suivre les instructions de [cet article](https://www.technorms.com/41496/enable-balloon-toasts-notifications-in-windows-10) si vous désirez voir une bulle en bas à droite de l'écran.


### **Dans Docker** :

* La toute première fois, vous devrez vous identifier pour être en mesure de télécharger des images Docker provenant de
  notre compte de la ville sur [Docker Hub](https://cloud.docker.com/app/vdmtl/dashboard/onboarding/cloud-registry).
  Pour ceci, lancez "_`docker login -u [USERNAME] -p [PASSWORD]`_". Ces informations seront sauvegardées sous
  "`~/.docker/config.json`" et vous n'aurez plus à les fournir à nouveau.

  Puis...

  _Avec VSCode:_

  * Sélectionnez la "launch configuration "`Debug in Docker`" et appuyez sur "`[F5]`".
    Ceci va créer une image Docker contenant tout ce qu'il faut pour exécuter l'application sans avoir à installer de
    composants Oracle localement, va démarrer un container Docker basé sur cette
    image en montant les fichiers de l'application, va lancer l'application en debug et va attacher un débogueur VSCode
    à ce processus. Vous serez alors en mesure d'ajouter des breakpoints et ils devraient être respectés!
    Note : si vous utilisez **Docker Toolbox**, avec Windows 7, vous devrez modifier la _launch configuration_ "`Debug in Docker`"
    pour y mettre l'"`address`" de la VM Docker (au lieu de "`localhost`")... En général il faut utiliser "`192.168.99.100`".
  * L'application aura été lancée dans le container en utilisant [Nodemon](https://github.com/remy/nodemon) : lorsque
    vous modifierez un fichier, l'application sera automatiquement relancée.
  * Après une modification, lorsque l'application est automatiquement redémarrée, il se peut que le débogueur de
    VSCode timeoute avant d'être réattaché correctement au nouveau processus... Ceci est un bogue de VSCode qui devrait être
    corrigé prochainement. D'ici là, vous devez alors réattacher le débogueur manuellement en recliquant sur "`[F5]`",
    bref en relançant la launch configuration "`Debug in Docker`". Le script va voir que le container Docker
    est déjà lancé et va simplement permettre au débogueur de s'attacher correctement.
  * Un "CTRL-C" dans le terminal intégré de VSCode va arrêter l'application, mais vous demeurerez dans le container Docker... Il vous sera
    alors possible de relancer l'application avec "`gulp debug`" si désiré. Vous devrez ici aussi réattacher le débogueur
    de VSCode par vous-même en relançant la launch configuration "`Debug in Docker`".

  _En ligne de commande:_

  * Lancer "_`npm run docker`_" ou "_`gulp docker`_" pour démarrer l'application dans un container Docker.
  * Trois commandes supplémentaires existent :
    * "_`npm run docker build`_" (ou "_`gulp docker build`_"), qui ne fera que re-builder l'image Docker.
    * "_`npm run docker bash`_" (ou "_`gulp docker bash`_"), qui vous premettra d'entrer dans le container directement, sans que le "`npm install`" initial ne soit lancé.
    * "_`npm run docker rm`_" (ou "_`gulp docker rm`_"), qui terminera le container existant, s'il est démarré.

Notez qu'il est recommandé de ne pas mélanger ces deux manière de travailler, "nativement" et "avec Docker", car le
"_`node_modules`_" généré ne sera pas nécessairement compatible! Si vous désirez tester les deux méthodes, il est
recommandé de supprimer le "`node_modules`" existant lorsque vous changez de méthode.

Aussi, si vous utilisez la solution avec Docker, il faut savoir qu'un "`CTRL-SHIFT-B`" ne fonctionnera _pas_ dans VSCode, car la compilation doit s'effectuer _dans le container_, là où les dépendances Oracles existent, et non localement.

---

## Initialiser la base de données pour faire de tests
Dans le code de l'application il existe un script qui permet d'initialiser la base de données avec des documents de test pour le contexte de l'application.

* Pour lancer le script :  
  _`npm run load-data`_

* Il est possible de modifier le paramètre **5000** dans le script npm `load-data` pour modifier le nombre de création d'intervention :  
  _`node_modules/.bin/gulp load-data --interv 5000`_


---

## Documentation des librairies **`@villemontreal`**

Une page Confluence répertoriant les différentes librairies déployées dans Nexus peut se trouver à : [https://sticonfluence.interne.montreal.ca/display/AES/Catalogue+de+librairies+Typescript+internes](https://sticonfluence.interne.montreal.ca/display/AES/Catalogue+de+librairies+Typescript+internes)

## 

---

## Commandes disponibles pour l'application

Les scripts _npm_ ne sont que des indirections vers des commandes _Gulp_, qui
peuvent être lancées directement si vous avez installé Gulp de manière globale.
Chaque commande a ainsi plus d'une manière d'être lancée.

* Pour lancer l'application _sans mode debug_ :  
  _`gulp start`_  
  _`npm start`_

* Pour lancer l'application en mode debug :  
  _`voir la section "Déboguage dans VSCode" plus bas!`_

* Pour lancer l'application sans mode debug et en évitant la recompilation :  
  _`gulp start --nc`_  
  _`npm run startnc`_

* Pour lancer l'application en utilisant Docker :  
  _`gulp docker`_  
  _`npm run docker`_

* Pour transpiler le TypeScript :  
  _`gulp compile`_  
  _`gulp c`_  
  _`npm run compile`_

* Pour supprimer les fichiers _.js_ et _.js.map_ générés par la transpilation :  
  _`gulp clean`_  
  _`npm run clean`_

* Pour lancer les tests (units et intégration) :  
  _`gulp test`_  
  _`npm test`_

  Notez que vous pouvez ajouter le paramètre "*`--bail`*" pour que les tests s'arrêtent dès qu'un test échoue! Par défaut, tous les tests
  vont rouler, même lorsqu'il y a en a en échec.

* Pour lancer les tests de charge (load) :  
  _`gulp test-load`_  
  _`npm run test-load`_

* Pour uniquement lancer Swagger Editor. Notez qu'un tel éditeur en mode "standalone" sera lancé sur un port
  différent de celui utilisé par l'application :  
  _`gulp editor`_  
  _`npm run editor`_

* Pour lancer la validation de l'application :  
  _`gulp validate`_  
  _`npm run validate`_

* Pour rebuilder l'image Docker
  _`gulp docker image`_  
  _`npm run docker image`_

* Pour entrer dans un container Docker directement  
  _`gulp docker bash`_  
  _`npm run docker bash`_

* Pour valider le lintage du projet (TSLint et Prettier)  
  _`gulp lint`_  
  _`npm run lint`_

* Pour fixer le lintage du projet (TSLint et Prettier). Notez que certaines règles TSLInt ne peuvent être fixées que manuellement.  
  _`gulp lint-fix`_  
  _`npm run lint-fix`_

* Pour valider le formattage avec Prettier  
  _`gulp prettier`_  
  _`npm run prettier`_

* Pour fixer le formattage avec Prettier  
  _`gulp prettier-fix`_  
  _`npm run prettier-fix`_

* Pour valider le lintage avec TSLint  
  _`gulp tslint`_  
  _`npm run tslint`_

* Pour fixer le lintage avec TSLint. Notez que certaines règles TSLInt ne peuvent être fixées que manuellement.  
  _`gulp tslint-fix`_  
  _`npm run tslint-fix`_

Notez que, par défaut, la majorité des commandes lancent premièrement la compilation (transpilation)
de Typescript vers Javascript. En utilisant Gulp directement, vous pouvez cependant passer le
paramètre "`--nc`" (`n`o `c`ompilation) à la fin d'une commande pour éviter cette compilation,
si elle n'est pas souhaitée. Par exemple :

* _`gulp test --nc`_

---

### Erreurs possibles lors d'un "`npm install`" :

* Problème de firewall.
  Au moment où vous lirez cette documentation il se
  peut que cela ait été réglé, mais nous avons présentement quelques problèmes avec nos règles de firewall et
  les appels SSL effectués par `npm`. Voici une [page Confluence](https://villemontreal.atlassian.net/wiki/pages/viewpage.action?pageId=39404786) relative à ce problème.
  La solution 100% fonctionnelle, pour le moment, est de faire une demande d'exception `FiltreUrlNoHTTPsInspec` au centre de service.
  Autrement, vous _aurez_ des problèmes lors de l'installation d'un projet démarré en utilisant ce générateur, particulièrement lors
  de l'installation des dépendances reliées à Oracle.

* Erreurs de permissions.  
  Tentez de lancer la commande avec "`sudo`" ou en tant qu'administrateur.
  

---

## Infos sur le projet

Ces pages HTML ne sont disponibles que lors du développement et non en production. Elles fournissent des informations sur
le projet et son développement.

* [http://localhost:12345/](http://localhost:12345/) : Informations générales sur le projet
* [http://localhost:12345/readme](http://localhost:12345/readme) : Le fichier "`README.md`", converti en HTML.
* [http://localhost:12345/open-api](http://localhost:12345/open-api) : Hyperliens vers les endpoints reliés à Open API.
* [http://localhost:12345/health](http://localhost:12345/health) : Hyperliens vers les endpoints reliés au status de l'application.
* [http://localhost:12345/metrics](http://localhost:12345/metrics) : Hyperliens vers les endpoints reliés aux statistiques de l'application.

---

## Les Endpoints par défaut du gabarit

**Note Importante :** ces URLS sont valides si vous utilisez le fichier de configuration "`default.yaml`" ou "`development.yaml`" par
défaut! Donc en local ou sur l'envionnement "development"... Sur d'autres environnements, vous devrez ajuster le host et le `domainPath`!
À ce sujet, assurez-vous de lire la section portant sur la configuration...

Notez que le _path_ d'un endpoint est composé de :

* La `racine` selon le type de endpoint (peut présentement être "_/api_", "_/documentation_" ou "_/diagnostics_")
* Le `domain path` (le domaine d'affaire, nombre de tokens variable)
* Le `path specifique au endpoint` (débutant par sa version!)

### Open API / Swagger

* [http://localhost:12345/documentation/some/business/domain/v1/ui](http://localhost:12345/documentation/some/business/domain/v1/ui) : Swagger UI (semble problématique avec certaines version de IE, utilisez un autre navigateur)
* [http://localhost:12345/documentation/some/business/domain/v1/editor](http://localhost:12345/documentation/some/business/domain/v1/editor) : Swagger Editor (seulement disponible en local et potentiellement sur l'environnement de développement)
* [http://localhost:12345/documentation/some/business/domain/v1/specification](http://localhost:12345/documentation/some/business/domain/v1/specification) : Le fichier de specs Open API (YAML)

### Diagnostics

* [http://localhost:12345/diagnostics/some/business/domain/v1/ping](http://localhost:12345/diagnostics/some/business/domain/v1/ping) : Retourne le texte "pong" et un code statut 200
* [http://localhost:12345/diagnostics/some/business/domain/v1/info](http://localhost:12345/diagnostics/some/business/domain/v1/info) : Retourne des informations sur le services, tel que
  le nom, la version, la date de publication, le code de projet...



---

## Déboguage dans [_VSCode_](https://code.visualstudio.com/)

### _Méthode #1 : avec autoreload_

Cette méthode recompile automatiquement les fichiers TypeScript lorsqu'ils sont modifiés
et relance automatiquement l'application...

* Ouvrir le terminal et lancer :  
  _`gulp debug`_  
  Ceci va lancer l'application en mode _debug_, en utilisant [nodemon](https://nodemon.io/) et le flag "`--debug`".

* Assurez-vous que, dans le panel _Debug_ de VSCode, la configuration sélectionnée est
  "_Local debugger_".

* Appuyez sur `[F5]`. Ceci va démarrer le débogueur de VSCode qui s'attachera à l'application.

À partir de ce moment, si vous modifiez un fichier TypeScript, il sera automatiquement recompilé,
l'application sera automatiquement redémarrée et le débogueur sera toujours fonctionnel! Vous
pouvez aussi ajouter et supprimer des breakpoints.

Pour arrêter ce mode debug avec autoreload, faite un `[CTRL]-[C]` dans le terminal.

### _Méthode #2 : sans autoreload_

Si vous n'aimez pas cette manière de travailler avec autoreload, vous pouvez toujours continuer à déboguer de manière
régulière, c'est à dire :

* Vous assurez que dans le panel _Debug_ de VSCode, la configuration sélectionnée est
  "_Debug locally_".

* Appuyez sur `[F5]`.

Avec cette manière de travailler, vous devez relancer l'application manuellement lorsque vous faites des
modifications aux fichiers TypeScript. Par exemple :

* `[SHIFT]-[F5]` - Arrête l'application
* `[F5]` - Recompile les fichiers TypeScript et relance l'application

Note : Dans le fichier `.local/vscode_suggested_settings/.vscode/launch.json` suggéré, _`"preLaunchTask": "compile"`_
est utilisée dans la configuration "_Debug locally_" et c'est pourquoi la compilation des fichiers
TypeScript est effectuée automatiquement lorsque cette configuration est lancée par `[F5]`.

### _Méthode #3 : avec Docker_

Veuillez lire la section relative à Docker dans [Comment lancer l'application en développement](#markdown-header-comment-lancer-lapplication-en-developpement) pour
les détails.

---

# Docker

## Installation Docker (Mac OS / Windows 10 / Linux)

* Installez Docker : [Windows 10](https://docs.docker.com/docker-for-windows/) /
  [Mac OS](https://docs.docker.com/docker-for-mac/) / [Linux](https://docs.docker.com/engine/installation/)

* That's it!

## Installation Docker Toolbox (Windows 7)

* Installez [Docker Toolbox](https://www.docker.com/products/docker-toolbox).

* Assurez-vous que votre projet (que nous appellerons ici "`mon-api-node`") est sous votre répertoire
  "_%userprofile%_"! Par exemple : _`C:\Users\[USER]\dev\mon-api-node`_  
  Le répertoire "_%userprofile%_" est mounté automatiquement dans la machine virtuelle
  lorsqu'on travaille avec Docker Toolbox et nous évite de devoir mounter quoique ce soit manuellement.

Puis :

* Démarrez le client Docker dans un terminal _git-bash_. Par exemple :  
  _`cd "C:\Program Files\Docker Toolbox"`_  
  et  
  _`"C:\Program Files\Git\bin\bash.exe" --login -i "C:\Program Files\Docker Toolbox\start.sh"`_  
  (Note : Personnellement, j'aime me faire un fichier "`dockerclient.bat`" contenant ces commandes. Je mets ce fichier
  dans mon `PATH` et je peux par la suite lancer le client Docker uniquement avec la commande "_`dockerclient`_")

## Lancer l'application avec Docker

* Allez dans le répertoire du projet (notez qu'avec Docker Toolbox, "`C:`" est accessible en utilisant "`/c/`"). Par exemple :  
  _`cd /c/Users/[USER]/dev/mon-api-node`_

* Créez une image Docker pour votre projet (Ajustez le fichier "`Dockerfile`" si requis et n'oubliez pas le "." à la fin de la commande suivante) :  
  _`docker build -t mon-api-node .`_

* Finalement, pour lancer l'application :  
  _`docker run -d -p 12345:12345 mon-api-node`_

## Déboguer l'application roulant dans Docker

Veuillez lire la section relative à Docker dans [Comment lancer l'application en développement](#markdown-header-comment-lancer-lapplication-en-developpement) pour
les détails.

---

## Développement

### Composants impliqués dans le traitement d'une requête

```
[Requête web] --> [Route] --> [Controlleur] --> [Services] --> [Repositories] --> [Client BD] --> [Source de données]
```

Lorsqu'une `requête` arrive à l'application, une `route` ("_src/routes.ts_") associée est déterminée (selon la _méthode HTTP_ de la requête, selon son _path_, etc.).
Cette `route` pointe vers une méthode précise d'un `controller` ("_src/controllers_"). Ces méthodes de controllers recevant les requêtes sont
appellées des "handlers". Ce sont les `controllers` et leurs handlers qui sont responsables de déterminer _comment_ une requête devra être traitée.

Le `controller` va extraire les paramètres de la `requête`, il peut s'agir de certains éléments de son _path_ ou de son _body_ lui-même, par exemple
dans le cas où la `requête` a été postée en tant que "_application/json_". Si nécessaire, le `controller` va valider que la `requête` est bien authentifiée, qu'il
est permis que l'action demandée par celle-ci soit exécutée. Le `controller` peut rejeter une `requête` inappropriée.

S'il est déterminé que l'action demandée par la `requête` peut être exécutée, le `controller` va appeller un ou plusieurs `services` ("_src/services_") qui seront
responsables d'exécuter la _logique d'affaire_ requise pour effectuer cette action.
C'est dans les `services` qu'a lieu le gros de la validation et de la logique d'affaire! En général, un `service` est associé à un domaine
plus ou moins précis, par exemple un "**User**Service" ou un "**Book**Service". Un `service` sait ce qui doit être fait pour **C**réer, **R**echercher,
**U**pdater ou **D**étruire les objets associés à son domaine. Un `service` peut lancer une erreur si les paramètres qui lui ont été passés ne sont pas valides.
Un `service` peut utiliser d'autres services.

Notez que la raison pour laquelle le gros de la logique d'affaire se retrouve dans les `services` et non directement dans les
`controllers`, c'est qu'un `service` peut potentiellement être utilisé d'ailleurs que depuis un `controller`! Par exemple, un
_cron_ (ou "scheduled task") pourrait lui aussi appeler des `services` dans le but d'effectuer certaines actions.
Les `services` sont donc le lieu ou est centralisée la logique d'affaire, et ils permettent que cette logique soit utilisée
de différents endroits, pas uniquement pour répondre à une `requête web`.

Lorsqu'un `service` doit manipuler des "entités" (aussi appelées "_models_" et situées sous "_src/models_"), qui sont des objets persistés dans une source de données,
bref s'il doit créer, rechercher, mettre à jour ou supprimer certaines entités de l'application, il passera par des `repositories` ("_src/repositories_").
Les `repositories` (aussi appelées "`DAO`" - "**D**ata **A**ccess **O**bject") sont les composants sachant comment et où exactement sont persistées
les entités de l'application. Par exemple, une "**User**Repository" saura
comment persister/rechercher un objet de type "User". Une `repository` est en général utilisée par un `service` via une _interface_ simple ne dévoilant pas comment elle est en fait implémentée. Par exemple une "**User**Repository" pourrait utiliser _PostgreSQL_, _Oracle_ ou _MongoDB_ et les `services` utilisant
cette `repository` ne connaitraient pas cette implémentation.

Notez qu'il arrive fréquement qu'un `service` ne soit qu'un "passthrough" vers une `repository`. Qu'il ne contienne pas d'autre code
que celui permettant de simplement transférer l'action demandée par un `controller` vers une `repository` (par exemple "_rechercher un
`user` en utilisant cet `id`_"). Par contre, si une action
demande de la logique plus complexe, des actions devant être transactionnelles, de multiple créations/suppressions, c'est dans le `service`
que tout cela sera effectué.

Finallement, l'implémentation d'une `repository`, par exemple une "UserRepository**Oracle**", va utiliser un `client BD` ("_src/repositories/clients_")
pour se connecter à la source de données requise. C'est le `client` qui utilisera les "credentials" provenant des configurations pour établir des
connections valides vers la source de données. C'est aussi ce `client` qui sera chargé d'initialiser la source de données,
de créer un pool de connections lorsque requis, etc. Un même `client BD` peut être utilisé par plusieures `repositories` partageant une même source de données.

**Note :** Cette architecture "`controller` --> `services` --> `repositories`" est classique et est utilisée dans plusieurs
gros projets (dans le monde _Java_ par exemple). Il se peut qu'elle semble un peu
"overkill" pour de petits services _Node_... À mon avis, il est bien de séparer une application en couches, même lorsqu'il s'agit d'une _petite_ application.
Cela dit, si vous déterminez que cette architecture est vraiment trop complexe pour le service que vous développez, il est possible d'éliminer les parties
`services` et `repositories` et mettre toute la logique requise directement dans les `controllers`. Les `controllers` pourraient alors directement
utiliser les `clients BD` et gérer les entités par eux-mêmes. Attention par contre à ne pas vous retrouvez avec une application spaghetti.

### Initialisation de l'application

Avant que l'application de soit démarrée réellement, c'est à dire avant que le serveur HTTP ne commence à répondre aux requêtes,
il est possible d'_initialiser certains components_ requis par votre application. Cette initialisation doit être déclarée
dans la fonction _`initComponents()`_ du fichier `src/init.ts`. Cette fonction sera appelée automatiquement lorsque la
structure de base sera en place (les routes, la gestion des erreurs, etc.), mais _avant_ que le serveur HTTP ne soit démarré.
C'est la place où vous pouvez créer un pool de connections si c'est requis, préparer des ressources, etc. Cette fonction est
`async` et chaque action qu'elle contient doit être "awaitée"! Le contrat associé à cette fonction est en effet que lorsque l'on
sort de la fonction, l'application est prête à 100%...

**Initialiser les librairies `@villemontreal`**

La très grande majorité de nos librairies custom (déployées dans Nexus) doivent être configurées avant d'être utilisées.
Ces librairies exportent en général une function "`init(...)`" qu'il faut appeler avec certains paramètres. Le paramètre
qui est pratiquement tout le temps requis en est un qui va permettre à la librairie de créer des loggers qui seront configurés comme
le veut l'API, à l'aide de la même fonction. Il s'agit pour cela d'appeller le `init()` avec la function "`createLogger`"
telle qu'exportée par notre fichier "`src/utils/logger.ts`"!

Voir le fichier `src/init.ts` fourni pour des exemples d'initialisation de librairies.

### Validation de l'application

Lorsqu'on démarre le serveur, l'application est automatiquement validée et ne démarrera tout simplement pas si des problèmes
sont trouvés! Une des validations effectuées est de s'assurer que le fichier de specs Open API de l'application ("_`open-api/open-api.yaml`_")
représente bien les routes de l'application. Pour cette raison, il est _obligatoire_ de définir les routes à exposer dans l'API
dans le fichier "_`src/routes.ts`_". Ce fichier sera utilisé lors de la validation des routes.

À cause de cette même validation, lorsque vous créez une nouvelle route il faut _nécessairement_ la définir à la fois dans "_`src/routes.ts`_"
et dans le fichier de specs _`open-api/open-api.yaml`_. L'application refusera de démarrer s'il manque quelque chose , mais il vous sera
en tout temps possible de rouler le _Swagger Editor_, pour vous aidez à mettre à jour le fichier de specs. Pour cela, il suffit de lancer :

_`gulp editor`_

### Le décorateur "@autobind"

Lorsqu'une route est exécutée et donc une méthode d'un controller appellée, il faut être certain que la valeur
de la variable "_`this`_" soit la bonne si utilisée dans la méthode. Pour ce faire, il faut que la méthode
_ait été bindée correctement_ ([documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/fonction/bind)).
Nous voulons que "_`this`_" représente _l'instance du controller_ à ce moment, ce qui n'est pas assuré en Javascript
(fait surprenant pour un développeur nouveau à ce langage!)

Le décorateur "`@autobind`" (fourni par la librairie [autobind-decorator](https://github.com/andreypopp/autobind-decorator)) s'occupe de binder
correctement les méthodes d'une classe à son instance, sans que vous ayez à le faire manuellement. Il suffit de décorer les classes de vos controllers avec ce dernier.
Voir le controller [testController](https://bitbucket.org/villemontreal/generator-mtl-node-api/src/master/generators/app/templates/src/controllers/testController.ts)
pour un exemple.

### Async/Await dans les controllers

Lorsqu'une erreur survient dans un controller, il faut tout le temps que le "`next(error)`" d'Express soit appelé pour que l'erreur
soit gérée correctement et qu'une réponse soit retournée à la requête HTTP courante. Ceci est fait automatiquement par le gabarit si vous
suivez les instructions suivantes...

* Chaque route _doit_ être déclarée dans le fichier _`src/routes.tc`_. Les routes déclarées dans ce fichier seront automatiquement wrappées
  avec un _try/catch_ appellant `next(error)` sans que cela doit être fait explicitement. Notez que vous pouvez _aussi_ mettre un _try/catch_ dans vos
  handlers et appeler le `next(error)` par vous-même! Le wrapper n'est qu'un filet de sécurité...

* Chaque handler défini dans un controller doit être spécifié comme étant _`async`_.

* Chaque appel asynchrone effectué dans un handler doit :

  * Soit être précédé du mot clé "_`await`_".
  * Soit être _retourné_ en tant que Promise (donc précédé du mot clé "_`return`_")

* Chaque handler doit aussi :

  1. Soit générer une réponse (bref, que les headers HTTP aient été envoyés à la sortie du handler)
  2. Soit appeler `next()`
  3. Soit appeler `render()`

  ... autrement, une erreur sera automatiquement retournée au client.



### Obtenir l'URL publique d'un endpoint

Lorsqu'une route est définie, seule une partie du path complet est spécifiée. Par exemple :

```typescript
{ method: HttpMethods.POST, path: "/v1/users", handler: userController.save }
```

Pour obtenir l'URL publique menant à ce endpoint, vous devez utiliser la fonction _`createPublicUrl(...)`_ fournie
dans le fichier "`src/utils/utils.ts`". Par exemple :

```typescript
let url = utils.createPublicUrl('/v1/users', EndpointTypes.API);
```

L'url sera à ce moment _`"http://localhost:12345/api/some/business/domain/v1/users"`_ (pour les configs par défaut et sur
l'environnement de développement). Il est important de spécifier le _type de endpoint_ ("`EndpointTypes.API`" dans notre exemple) car ceci
modifie la racine du path final...



### Pagination avec Knex

Deux fonctions sont fournies pour faire de la pagination avec Knex, par le fichier `src/utils/knexUtils.ts` :

* **_paginate()_** : prend en paramètre le client Knex, un `QueryBuilder` de Knex, un `offset` et une `limit`. Retourne un
  object de type `IPaginatedResult<any>` (fourni par le fichier `src/models/core/pagination.ts`) contenant
  les _rows_ de la base de données (limitées en nombre) ainsi que le _nombre total_ de résultats qui
  seraient retournés sans pagination (sans le "`limit`").

* **_totalCount()_** : prend en paramètre le client Knex et un `QueryBuilder` de Knex. Retourne le _nombre total_ de résultats qui
  seraient retournés par la requête, mais sans les _rows_ elles-mêmes. Si la requête de base
  contient une `limit` ou un `offset`, ils seront ignorés.

Ce que permettent ces deux fonctions, c'est de ne pas avoir à déclarer une requête de multiples façons,
particulièrement lorsqu'on veut un nombre limité de résultat _mais également le nombre total de résultats_!

Voici un exemple.

Par défaut, une requête `SELECT` se lance par Knex de cette manière :

```typescript
let resultSet = await knexClient
  .select('id', 'author', 'title')
  .from('books')
  .orderBy('author');
```

Lorsque vous définissez une requête avec Knex, vous créez en fait un _builder_ (de type `QueryBuilder`). Knex est
basé sur les Promesses, et ce n'est que lorsque la promesse du builder se résout (par "`.then()`" ou en utilisant "`await`")
que Knex va transformer le builder en requête SQL et l'exécuter.

Il faut savoir que ce builder dynamique de Knex peut être créé _sans être exécuté immédiatement_. C'est ce truc qui est utilisé
par les fonctions `paginate()` et `totalCount`... Il s'agit de construire votre requête Knex
mais sans l'exécuter (sans "`.then()`" ou "`await`"), puis de faire appel à la fonction requise pour
obtenir ce que vous désirez :

```typescript
// Requête de base. Pas de "await" ni de "then()"!
let query = knexClient
  .select('id', 'author', 'title')
  .from('books')
  .orderBy('author');

// Obtention d'un resultSet paginé :
// - 3 livres en partant de l'offset "0"
// - le nombre *total* de livres
let paginatedResult: IPaginatedResult<any> = await knexUtils.paginate(knexClient, query, 0, 3);
```

ou, pour uniquement obtenir le _nombre total_ de livres, sans les _rows_, à partir de cette requête de base :

```typescript
// Obtention du nombre total de livres :
let totalCount: number = await knexUtils.totalCount(knexClient, query);
```

Finalement, la requête de base peut aussi être lancée telle quelle, sans pagination, en utilisant :
"`.then()`" ou "`await`" :

```typescript
// Lance la requête telle quelle!
let resultSet = await query;
```

Si ce n'est qu'une seule des fonctions qui vous intéresse, vous pouvez aussi déclarer votre requête directement
en tant que paramètre :

```typescript
let paginatedResult: IPaginatedResult<any> = await knexUtils.paginate(
  knexClient,
  knexClient
    .select('id', 'author', 'title')
    .from('books')
    .orderBy('author'),
  0,
  3
);
```

Notez que ces fonctions, `paginate()` et `totalCount()`, ne fonctionnent évidemment que sur une requête
de type `SELECT`. Aussi, si vous tombez sur un cas ou une requête complexe ne fonctionne pas avec
ces fonctions, veuillez nous en avertir! Ou encore mieux : faites un fix et soumettez une
pull request!

### Mocker les sources de données lors des tests

Les composants qui doivent être mockés le plus souvent, lors des tests, sont les _sources de données_. En effet, on ne
veut évidemment pas que les tests aient un effet quelconque sur les _vraies_ sources de données et, aussi, on veut que les
tests soient "self-contained", c'est à dire qu'ils puissent être lancés sans avoir besoin d'un accès
aux réelles sources de données.

Il y a plusieures méthodes permettant de mocker une source de donnée, et elles utilisent souvent la librairie
[sinon](http://sinonjs.org/). On peut, par exemple, carrément mocker la méthode de la repository
que l'on utilise et lui faire retourner un résultat mocké. Cette manière de mocker le résultat d'une requête sur
une source de données est la plus simple, mais également la moins précise... En effet, tout le traitement qui se fait
dans cette méthode de repository est alors complètement contourné et _non testé_. C'est pourquoi nous fournissons des
utilitaires permettant de mocker de manière plus précise...

#### Mocker Mongo/Mongoose

Une fonction `mockMongoose()` est fournie dans le fichier `src/utils/mongoUtils.ts`. Cette fonction utilise la librairie
[Mockgoose](https://github.com/mccormicka/Mockgoose) en dessous du capot pour démarrer un réel serveur Mongo, mais totalement
indépendant. C'est une méthode de mocking extrêmement efficace car les requêtes sont testées sur un _vrai_ serveur Mongo et
ainsi les tests représentent très bien ce qui roulera en production. L'autre avantage de cette technique est qu'une fois
que la fonction `mockMongoose()` a été appelée, le code de l'application peut continuer à rouler de manière habituelle, mais
tout ce qui touche à Mongo/Mongoose sera automatiquement intercepté pour utiliser la version mockée de Mongo!

Notez que vous pouvez aussi appeler `mongoUtils.dropMockedDatabases()` pour supprimer toutes les collections ayant été crées sur le
serveur Mongo mocké.

**`>>>`** Voir la suite de tests du fichier [userController.test.ts](https://bitbucket.org/villemontreal/generator-mtl-node-api/src/3104909751b15afbac0ef388a9908f10f8b74adf/generators/app/templates/src/controllers/userController.test.ts?at=master&fileviewer=file-view-default#userController.test.ts-32) pour un exemple d'utilisation.

#### Mocker Knex

Il ne semblait pas exister de solution déjà existante permettant de mocker une source de données
accédée par `Knex` d'une manière satisfaisante. La librairie qui est en général suggérée est [mock-knex](https://github.com/colonyamerican/mock-knex), mais
celle-ci comporte certains désavantages : elle nécessite la dépendance `sqlite3` et, pour fonctionner, elle créé une réelle base de données
SQLite... Ceci peut être embêtant, particulièrement avec un système Oracle déjà existant, car plusieures requêtes vont échouées, puisque les
_tables_ et _vues_ utilisées par les requêtes _n'existeront pas sur la BD mockée_!

C'est pourquoi nous avons créé une fonction utilitaire `createKnexMockedClient()`, fournie par le fichier `src/utils/knexUtils.ts`.
Cette fonction retourne un object de type `IKnexMockedClient` (exporté par le même fichier). Cet object est un client `Knex` valide, mais
ayant été mocké pour ne pas réellement exécuter les requêtes. Au lieu de cela, sont fournis des "stubs" (de la librairie `sinon`)
permettant de modifier les résultats mockés et un "spy" (aussi de la librairie `sinon`) permettant d'inspecter la requête
SQL telle qu'elle serait réellement lancée sur une BD non mockée.

Par exemple, admettons que nous ayons un fichier `src/repositories/clients/gdcClient.ts` qui exporte une fonction `getGDCClient()`
retournant un client _Knex_ relié à la base de données GDC de Oracle. Alors, dans une suite de tests, nous pourrions mocker ce
client par :

```typescript
// Importe le Module en tant que tel
import * as gdcClientModule from '../repositories/clients/gdcClient';

// Créé un client Knex mocké
let mockedClient = await knexUtils.createKnexMockedClient();

// Créé un stub pour la fonction retournant le client original
let getGDCClientStub = sinon.stub(gdcClientModule, 'getGDCClient');

// ... et lui fait retourner le client mocké au lieu de l'original!
getGDCClientStub.returns(mockedClient);
```

Par la suite, toutes les requêtes effectuées en utilisant le client "GDC" vont en fait être mockées! Par défaut, une requête
va retourner un array vide et un "totalCount" de "0" (si de la pagination est utilisée).

Par contre, il est évidemment possible de modifier ce qui doit être retourné comme résultat mocké. Premièrement en utilisant
`client.resultStub` qui est un "stub" (de la librairie `sinon`) sur le client mocké. Par exemple :

```typescript
mockedClient.resultStub.returns([
  {
    name: 'toto'
  },
  {
    name: 'titi'
  }
]);
```

Ici, une requête effectué à l'aide du client va retourner un array contenant ces deux éléments.

Vous pouvez également utiliser ce stub pour simuler une erreur Oracle :

```typescript
mockedClient.resultStub.throws(new Error('Some fake Oracle error'));
```

Deuxièmement, il est possible de modifier le "totalCount" retourné par une requête paginée (voir section précédante),
en utilisant le stub `client.totalCountStub`. Par exemple :

```typescript
mockedClient.totalCountStub.returns(123);
```

Finalement, un "spy" (de la librairie `sinon`) est fourni : `client.beforeQuerySpy`. Ce spy est appelé automatiquement
_juste avant_ que la requête ne soit exécutée par `Knex` (bien que mockée!). En paramètre du spy, est reçu un objet
contenant des informations sur la requête SQL sur le point d'être exécutée, particulièrement la requête SQL elle-même (en string)
et les _bindings_ associés (pour les paramètres bindés). Par exemple :

```typescript
let queryInfo: any = mockedClient.beforeQuerySpy.getCall(0).args[0];
assert.isTrue(queryInfo.sql.indexOf(`order by "DATE_MODIF" desc`) > -1);
```

En utilisant ce spy, on peut valider la requête SQL qui sera exécutée en production, avant qu'elle ne soit en fait mockée. Vous pouvez
mettre un breakpoint pour voir les informations contenues dans ce paramètre passé au spy.

**`>>>`** Voir la section "_Knex mocked client_" de la suite de tests du fichier [knexUtils.test.ts](https://bitbucket.org/villemontreal/generator-mtl-node-api/src/8269ad103f47965893f0045f2a765993e79763a9/generators/app/templates/src/utils/knexUtils.test.ts?at=develop&fileviewer=file-view-default#knexUtils.test.ts-611).

**`>>>`** Voir aussi la suite de tests du fichier [serviceRequestController.test.ts](https://bitbucket.org/villemontreal/service-request-api/src/2ae19b9e35746a5f0dea1e208af7f36e873d0972/src/controllers/serviceRequestController.test.ts?at=develop&fileviewer=file-view-default#serviceRequestController.test.ts-44) pour un exemple d'utilisation dans une application réelle.

En résumé, ce que permet ce client Knex mocké, comparativement à la technique consistant à mocker une fonction de repository directement, c'est
que prèsque tout est testé, jusqu'à la création de la requête elle-même! En effet, le client mocké est un réel client `Knex` et il permet donc
tout ce que le client non mocké permet : `select()`, `from()`, `where()`, etc. Ce n'est que lorsque la requête SQL vient à être
exécutée que l'appel est intercepté et mocké. Ceci vous permet donc de tester la _vraie_ requête SQL qui sera lancée, ainsi que toute la
logique qui aura été utilisée pour la bâtir.

### Script non commité pour tests locaux

Si vous voulez lancer un script pour tester quelques parties de votre application, nous recommendons
un fichier "`src/test.ts`". Ce fichier précis est déjà ignoré dans Git alors il n'y a pas de danger de le commiter
par mégarde. Nous fournissons un template exemple pour un tel fichier, à "`local/suggested_local_test_template/test.ts`", vous
pouvez tout simplement le copier à "`src/test.ts`".

Si vous utilisez VSCode, une "_launch configuration_" est fournie permettant de déboguer ce fichier :
"_`Debug the 'src/test.ts' file`_". Il suffit de sélectionner cette configuration dans le panel
"_Debug_" de VSCode, puis de faire un "_`[F5]`_" pour lancer le script en mode debug.

### Tests

Les tests vont à côté des fichiers testés, ont le même nom que ces derniers mais avec un suffix _`.test.ts`_.

Lorsque _`gulp test`_ (ou _`npm test`_) est lancé, trois choses sont exécutées :

* La validation de `TSLint` (avec les règles définies dans "_`tslint.json`_") et du formmatge Prettier.
  Les tests vont _échouer_ si le code ne respecte pas ces règles.
* La validation effectuée par "`src/utils/appValidator.ts`". Pour le moment, ceci valide si les routes publiques de l'application sont est
  sync avec ce qui est défini dans le fichier de specs Open API.
* Les tests unitaires et d'intégration eux-mêmes.

**Note** : Si vous regardez les exemples de tests où du mockage est effectué, vous remarquerez que la librarie `sinon` est en général utilisée.
Il faut savoir que de la manière dont nos routes sont spécifiées, et de la manière dont "_this_" fonctionne en Javascript,
_il n'est pas possible de mocker un handler d'un controller avec `sinon`_, par exemple pour tester un _middleware_. En général, si
vous tentez de mocker un handler, vous pouvez plutôt créer _une app custom_, avec des routes custom, en utilisant la fonction `createApp()`
du fichier `src/core/app.ts` au lieu de `createDefaultApp()`! De cette manière vous n'avez pas besoin de mocker de handlers, vous les définissez
par vous-mêmes, selon vos besoins. Si vous devez nécessairement mocker un handler _existant_, vous devrez le faire en le remplaçant directement
sur l'instance du controller, sans passer par `sinon`. Par exemple :

```
// mock the "someHandler" handler :
myController.someHandler = (req: express.Request, res: express.Response, next: express.Nextfonction): Promise<void> => {
    res.sendStatus(200);
}
```
#### Couverture des tests unitaires

Le package [nyc](https://github.com/istanbuljs/nyc) est utilisé pour calculer la couverture des tests unitaires d'un projet. Cet utilitaire calcule la couverture des tests unitaires et permet de mettre le build en erreur si l'objectif de couverture (calculé en pourcentage) n'est pas atteint.

La configuration de cet utilitaire se trouve dans le fichier `.nycrc` à la racine du projet. Voici la signification des différentes configurations. (Pour les aventuriers, vous pouvez expérimenter avec plus d'options qui sont décrites dans le [README du projet nyc](https://github.com/istanbuljs/nyc/blob/master/README.md))

* `"check-coverage": true` mets le build en erreur si la couverture n'atteint pas l'objectif établi. Une valeur `false` effectuerait le calcul de la couverture sans mettre le build en erreur.
* `"per-file": false` utilise la couverture globale de l'ensemble des fichiers pour sa validation. Une valeur `true` effecturerait le calcul de la couverture pour chaque fichier séparemment.
* `"lines": 60` indique que l'objectif de couverture au niveau des lignes est de 60%
* `"statements": 60` indique que l'objectif de couverture au niveau des statements est de 60%
* `"functions": 60` indique que l'objectif de couverture au niveau des fonctions est de 60%
* `"branches": 60` indique que l'objectif de couverture au niveau des branches est de 60%
* `"include": ["src/**/*.js"]` indique que tous les fichiers .js sous le dossier 'src' sont inclus dans le calcul de la couverture.
* `"reporter": "text"` indique à l'outil de générer le rapport de couverture sous format texte.
* `"cache": true"` permet d'activer la cache de l'outil.

> **La valeur par défaut de couverture est de 60% afin de s'assurer que les tests unitaires passent le calcul de couverture pour un projet fraîchement généré. À vous de trouver le bon pourcentage de couverture pour votre projet.**

##### Exemple de rapport

Voici un exemple de rapport généré par nyc indiquant les pourcentages de couvertures ainsi que les lignes non-couvertes
```
-------------------------------|----------|----------|----------|----------|-------------------|
File                           |  % Stmts | % Branch |  % Funcs |  % Lines | Uncovered Line #s |
-------------------------------|----------|----------|----------|----------|-------------------|
All files                      |    85.68 |    69.18 |    78.87 |    85.46 |                   |
 src                           |    89.47 |      100 |       50 |    89.47 |                   |
  init.ts                      |    86.67 |      100 |    33.33 |    86.67 |             44,58 |
  routes.ts                    |      100 |      100 |      100 |      100 |                   |
 src/controllers               |       70 |      100 |        0 |     62.5 |                   |
  workDescriptionController.ts |       70 |      100 |        0 |     62.5 |          33,35,40 |
 src/controllers/core          |    92.16 |    68.57 |    78.57 |    91.67 |                   |
  devController.ts             |      100 |      100 |      100 |      100 |                   |
  diagnosticsController.ts     |    76.47 |       50 |       40 |    73.33 |       42,43,50,57 |
  errorController.ts           |    92.31 |     69.7 |      100 |       92 |      84,85,87,104 |
 src/core                      |    89.76 |    77.59 |    91.18 |    90.12 |                   |
  app.ts                       |    91.53 |    75.93 |    90.91 |    92.24 |... 46,332,334,360 |
  errorManagement.ts           |    78.13 |      100 |    85.71 |    78.13 |... 34,35,85,86,88 |
  unlistedRoutes.ts            |      100 |      100 |      100 |      100 |                   |
 src/models/core               |    87.18 |       50 |       75 |    87.18 |                   |
  route.ts                     |    87.18 |       50 |       75 |    87.18 |    37,38,39,41,49 |
 src/repositories              |       20 |        0 |        0 |       20 |                   |
  workDescriptionRepository.ts |       20 |        0 |        0 |       20 |... 37,42,48,49,51 |
 src/repositories/clients      |       50 |        0 |        0 |       50 |                   |
  contremaitreClient.ts        |       50 |        0 |        0 |       50 |          18,19,34 |
 src/services                  |    66.67 |      100 |        0 |    66.67 |                   |
  workDescriptionSevice.ts     |    66.67 |      100 |        0 |    66.67 |                23 |
 src/utils                     |    81.93 |    65.91 |    85.71 |    81.48 |                   |
  appUtils.ts                  |    23.08 |        0 |        0 |    23.08 |... 14,15,17,18,20 |
  logger.ts                    |      100 |      100 |      100 |      100 |                   |
  utils.ts                     |    90.38 |     72.5 |      100 |    90.38 |  96,97,98,101,135 |
 src/utils/configs             |      100 |      100 |      100 |      100 |                   |
  configCache.ts               |      100 |      100 |      100 |      100 |                   |
-------------------------------|----------|----------|----------|----------|-------------------|
```

#### Configurations pour les tests

Il est possible d'utiliser un fichier "`local-development-tests.yaml`" pour overrider les configurations utilisées lors des tests. Ce fichier
"`local-development-tests`" aura précédance sur *tout autre fichier*, même sur le fichier "`local-tests.yaml`"!

Voici les fichiers de configuration loadés localement lorsque des tests sont lancés, dans l'ordre:

- `default.yaml`
- `default-tests.yaml`
- `development.yaml`
- `development-tests.yaml`
- `local.yaml`
- `local-tests.yaml`
- `local-development.yaml`
- `local-development-tests.yaml`
- `custom-environment-variables.yaml` (non utilisé pour le moment)

Explication : Lorsque les tests sont lancés par _`gulp test`_, qu'une tâche Gulp dont le nom commence par "`test-` est lancée, ou encore en lançant une 
"debug configuration" de VSCode reliée aux tests, la variable d'environnement
`NODE_APP_INSTANCE` sera initialisée à la valeur "`tests`" (dans "`gulpfile.js`")...

En regardant la [documentation](https://github.com/lorenwest/node-config/wiki/Configuration-Files#file-load-order)
de la librairie `node-config` que l'on utilise, on peut voir qu'un fichier "_{deployment}-{instance}.EXT_" override un
fichier "_{deployment}.EXT_". Le token "{deployment}" est l'environnement, tiré de la variable d'environnement "`NODE_ENV`", et
"{instance}" est la valeur tirée de la variable d'environnement `NODE_APP_INSTANCE`.

Notez que, malheureusement, de la manière dont Mocha fonctionne par défaut, les tests seront tous roulés _dans le même "context"_. Cela signifie que
les configurations ultimement tirées de "`local-tests.yaml`", seront utilisées pour _tous les tests_. Si un fichier de test a besoin de configurations
différentes, d'un composant réagissant d'une manière différente, il faut se rabattre sur le *mockage* (par exemple avec [sinon](https://sinonjs.org).

Si vous avez besoin de déterminer programmaticalement si le processus courant a été lancé en mode "test" ou non, vous pouvez utiliser :
"`if(configs.testingMode) {...}`".

### Authentification (validation JWT)

Le gabarit contient le middleware `jwtValidationMiddleware` tiré de la librairie [`@villemontreal/core-jwt-validator-nodejs-lib`](https://bitbucket.org/villemontreal/core-jwt-validator-nodejs-lib). Ce middleware est activé dans le fichier "`src/core/app.ts`", mais
(par défaut) uniquement aux endpoints de type "`/api`". Si vous désirez un contrôle plus pointu sur les routes sur lesquelles
ce middleware sera appliqué ou non, vous pouvez le supprimer de "`src/core/app.ts`" et uniquement l'ajouter aux routes concernées,
dans le fichier "`src/routes.ts`".

Notez que, pour tester en local sans devoir vous préoccuper de devoir passer un quelconque token d'authentification, vous pouvez
mettre la configuration "`security.jwt.enable`" à "`false` dans le fichier "`config/local.yaml`".

### Tests nécessitant de l'authentification, avec Postman

Lorsqu'un API requiert de l'authentification (avec token JWT), il n'est plus possible de tester ses endpoints directement, sans passer un
header "`Authorization`" valide! Ceci peut être compliqué car il faut effectuer certaines opérations précises pour obtenir
le token requis.

Nous avons mis en place une manière simple de créer ce header "`Authorization`", lorsque [Postman](https://www.getpostman.com/)
est utilisé pour lancer les requêtes.

#### Utilisation

( Un [vidéo](https://youtu.be/N5fKfWycIdw) démontrant cette méthode. Notez que ce vidéo n'est plus à jour et peut contenir certaines différences 
  d'avec la version présente du script. En cas de différence, la documentation présente est à respecter!)

Il suffit premièrement d'importer dans Postman le fichier  
"`.local/postman/authorization_header_generation_v3/Auth v3.1.postman_collection.json`". Ceci va importer une collection nommée "`Auth v3.1`" contenant trois requêtes.

Puis, en utilisant cette collection:
- Ouvrez la requête "`Access Token`".
- Ouvrez son onglet "`Pre-request Script`"
- Dans la section "`Configuration`" du haut, spécifiez les informations requises pour votre authentification. Voir la section
  "`Configurations`" suivante pour les détails sur les configurations à utiliser!
- Lancez la requête. Si tout se passe bien, vous verrez dans la réponse l'Access Token généré. Ce token est à ce moment automatiquement ajouté à une variable
  Postman nommée "`{{authHeader}}`". En fait cette variable contiendra "`Bearer LE-ACCESS-TOKEN`" (le "`Bearer`" est ajouté)!

Vous êtes maintenant en mesure de lancer une requête vers un endpoint protégé par authentification! Il s'agit simplement d'ajouter le header
"`Authorization`" à la requête et de lui attribuer la valeur "`{{authHeader}}`" (attention, il ne faut _pas_ utiliser "`Bearer {{authHeader}}`"!).
Voir la requête "`Protected endpoint example`" pour un exemple.

Si vous désirez tester l'authentification _en local_, il y a une étape supplémentaire à effectuer car vos requêtes ne passeront alors
pas par Kong et il faut donc que votre header "`Authorization`" soit un _JWT_ valide, et non un _Access Token_ valide! Pour obtenir ce
_JWT_ valide il suffit de lancer la requête "`JWT`" de la collection `Auth v3`", _après avoir lancée la requête "`Access Token`"_ de la même collection!
À ce moment la variable "`{{authHeader}}`" ne contiendra pas un _Access Token_, mais un _JWT_. La requête lancée vers votre serveur local
devrait par la suite fonctionner.

#### Configurations

- ***`authMethod`*** (Mode d'authentification)  
  **Requise*  
  Il y a deux type d'authentification:
  - "`api`" - Va utiliser un endpoint ("`/oxauth/seam/resource/restv1/oxauth/token`") exposé directement par Gluu pour obtenir l'Access Token.
  - "`web`" - Utilise le même flow *oauth* qu'une application SPA web client. 
  
  *Les différences...*

  La méthode "`api`":
  - À utiliser de préférence!
  - Nécessite de connaitre le "`secret`" du *Client* à utiliser, en plus du username et password pour lesquels obtenir un
    access token.
  
  La méthode "`web`":
  - Permet d'obtenir un acceess token pour un citoyen, en prod, sans devoir connaitre le "`secret`" du *Client*. Il
    faut par contre spécifier une `URL de redirection` valide.
  
- ***`env`*** (L'environnement)  
  **Requise*  
  Peut être "`dev`", "`acc`" ou "`prod`". 

- ***`clientId`*** (Le '`inum`' Gluu du client)  
  **Requise*  
  D'un format semblable à "`@!4025.CA62.9BB6.16C5!0001!2212.0010!0008!2212.0170`".

- ***`clientSecret`*** (Le mot de passe du client Gluu)  
  ****Requise uniquement pour la méthode d'authentification "`api`"***   
  Example: "`clt5kwy87T`".

- ***`redirect_uri`*** (Une url valide de redirection)  
  ****Requise uniquement pour la méthode d'authentification "`web`"***   
  Example: "`https://services.dev.interne.montreal.ca/sim-gestion-des-matieres-dangereuses/authorize`".
  N'importe quelle url de redirection enregistrée dans Gluu pour ce client est acceptable.

- ***`user`*** (L'utilisateur pour lequel obtenir l'Access Token)  
  **Requise*  
  Peut être d'un de ces formats:
  - "*`hebertdanny@gmail.com`*" - Un email, pour un *citoyen*.
  - "*`xgmdw10`*" - Un code "`u`" ou "`x`" pour un *employé* de la ville.
  - "*`srvAccBPM`*" - Un code "`srvXXXXX`" pour un *service account*.
  
- ***`password`*** (Le '`password`' de l'utilisateur)  
  **Requise*  
  Example: "`asdf1234`".

- ***`scope`*** (Les informations auxquelles on veut avoir accès avec l'Access Token)  
  **Requise*  
  Example: "`openid profile user_name`".


### Varia

* Les constantes de l'application vont dans : _/src/configs/constants.ts_
* Les configurations de l'application vont dans : _/src/configs/configs.ts_.
* Les données requises par les tests vont sous : _/tests/resources_.
* Les données _générées_ par les tests vont sous : _/test-data_. Ce répertoire est ignoré dans Git.

---

## Configurations de l'application et environnement

La librairie de configurations utilisée est [node-config](https://github.com/lorenwest/node-config).

Les types d'environnement reconnus présentement sont : "`development`", "`acceptation`" et "`production`". Par défaut, l'application roulera avec le type d'environnement "`development`" (même en local). Si vous devez nécessairement spécifier un autre type d'environnement à utiliser, il faut utiliser la variable d'environnement "`NODE_ENV`",
mais ceci n'est pas requis par défaut...

Les configurations de l'application sont spécifiées dans des fichiers `YAML` situés dans le répertoire
_`config`_, à la racine du projet :

* Le fichier _`default.yaml`_ contient les configurations utilisées par défaut. *Toutes* les configurations devraient y être, avec une valeur vide (ou "*`to-override`*") si nécessaire. Dans les autres fichiers, il possible d'overrider ces configs par défaut.
* Le fichier `development.yaml` contient les configurations spécifiques à utiliser lorsque l'environnement est "development".
* Le fichier `acceptation.yaml` contient les configurations spécifiques à utiliser lorsque l'environnement est "acceptation".
* Le fichier `production.yaml` contient les configurations spécifiques à utiliser lorsque l'environnement est "production". Certaines
  configurations (plus sensibles et appelées "`des secrets`") devront être vides et être fournies par Jenkins.
* Le fichier `local.yaml` contient les configurations qui seront utilisées par défaut lorsque l'application est lancée localement.
  Ce fichier est ignoré dans `.dockerfile` et c'est pourquoi il ne sera pas utilisé sur d'autres environnement (qui utilisent tous Docker).

Le fichier `local.yaml` (et son pendant pour les tests, "`local-tests.yaml`") permet de spécifier des configurations par défaut différentes en local que sur la dev. Un
gros avantage de ceci est que lors d'un clone clean du projet, l'application et les tests lancés n'entreront pas en conflit avec ce qui
roule sur *dev*, ils n'utiliseront pas les mêmes informations de base de données par exemple.

Finalement, eux autres fichiers, ceux-çi ignorés dans Git, peuvent être *créés manuellement* localement pour overrider les configurations:
- `local-development.yaml`
- `local-development-tests.yaml`

Vous mettez dans ces fichiers les configs que vous voulez. Ces fichiers ne sont pas commités.

Des exemples de ces fichiers sont fournis avec une extension "`.exemple`":
- `local-development.yaml.example`
- `local-development-tests.yaml.example`

Il faut enlever l'extension "`.example`" pour que les fichiers deviennent fonctionnels...

Pour résumer l'ordre dans lequel les fichiers de configs seront loadés localement, lorsque vous ajoutez un fichier
`local-development.yaml` manuellement:

- `default.yaml`
- `development.yaml`
- `local.yaml`
- `custom-environment-variables.yaml` (non utilisé pour le moment)

Et lorsque les tests sont lancés (avec `local-development-tests.yaml` également ajouté manuellement):

- `default.yaml`
- `default-tests.yaml`
- `development.yaml`
- `development-tests.yaml`
- `local.yaml`
- `local-tests.yaml`
- `local-development.yaml`
- `local-development-tests.yaml`
- `custom-environment-variables.yaml` (non utilisé pour le moment)

Notez qu'il est aussi possible d'overrider les configurations en ligne de commande ou par variables d'environnement. Voir la documentation de
[node-config](https://github.com/lorenwest/node-config) à ce sujet!

Note: veuillez lire la section `Configurations pour les tests` plus haut relativement aux configurations utilisées *lors des tests*.

### Utiliser un nom d'environnement custom

Si cela est réellement requis pour vous, il est possible de créer une variable d'environnement `NODE_ENV` localement, avec une valeur
comme "`roger`" (votre nom ou autre). Ceci fera en sorte que ce *ne sera plus* "`development`" le nom de l'environnement utilisé en démarrant
l'application et les tests, mais "`roger`". Vous devrez tenir compte de ce fait pour déterminer les fichiers de 
configurations qui seront utilisés (et potentiellement créer `local-roger.yaml` et `local-roger-tests.yaml`).

### Valider l'environnement programaticallement

Pour valider l'environnement programaticallement, des propriétés existent dans l'objet de configs : "`isLocal`", "`isDev`", "`isLocalOrDev`"
"`isAcc`", "`isProd`".

### Configurations dynamiques

En général, toutes les configurations devraient avoir une valeur de base dans le fichier "`config/default.yaml`" et potentiellement être overridées
dans les autres fichiers d'environnement. Mais il peut y avoir certains cas où la valeur d'une configuration est calculée 
_sans qu'une valeur de base ne soit requise dans un fichier_. 

Par exemple, une configuration pourrait directement retourner une variable d'environnement. À ce moment, il n'y a pas besoin de mettre
quelque valeur que ce soit dans les fichiers de configuration... La valeur de la config sera calculée *dynamiquement*, directement
dans "`config/configs.ts`".

Voici un exemple d'une telle configuration dynamique (tiré du fichier "`config/configs.ts`"):

```typescript
schema: this.cache.dynamic<string>('dataSources.directDb.schema', () => {
  let schemaToUse = this.environment.isDev ? (this.isTestingMode ? 'dev_testing' : 'dev') : 'dbo';
  if (this.environment.isDev && process.env.BRANCH_NAME && process.env.BRANCH_NAME.trim() !== '') {
    schemaToUse = process.env.BRANCH_NAME.trim();
    schemaToUse = 'dev_' + schemaToUse.replace(/[/\-.]/g, '_');
    // Maximum length for a SQL Server schema name
    if (schemaToUse.length > 128) {
      schemaToUse = schemaToUse.substring(0, 128);
    }
  }

  return schemaToUse;
}),
```
Ici, la configuration n'est présente dans aucun fichier de configuration. Elle est créée dynamiquement, en
utilisant une variable d'environnement.

Remarquez qu'une telle configuration dyamique nécessite quand même une *clé*  (ici "`dataSources.directDb.schema`"), 
pour pouvoir mettre la valeur calculée en cache.

---

## Logging

Pour logger, l'API utilise la librairie [@villemontreal/core-utils-logger-nodejs-lib](https://bitbucket.org/villemontreal/core-utils-logger-nodejs-lib)
et définie une fonction `createLogger(...)` qui créera des loggers configurés correctement. Voir le fichier `src/utils/logger.ts` pour les détails.

Les loggers créés de cette manière vont ajouter automatiquement à chaque log des informations pertinentes, particulières les bonnes
Correlation Ids! Avec de telles Correlation Ids dans tous nos logs, nous pouvons "suivre" le fil d'une requête au sein de nos systèmes
en recherchant cette cid dans [Graylog](https://graylog.dev.interne.montreal.ca/) (ici URL de dev).

Les loggers acceptent aussi bien un eimple message en String, qu'un object javascript complexe.

Les logs sont écrits en Json. Pour des messages de log plus lisibles dans la console lors du dévelopement, vous pouvez mettre la
configurations "`logging.humanReadableInConsole`" à "`true`" dans le fichier local "`config/local.yaml`".

Finalement, notez qu'il est important de passer la fonction `createLogger(...)`, telle que définie dans `src/utils/logger.ts` aux
librairies de la ville utilisées dans le projet! Ceci fait en sorte que les librairies loggeront exactement de la même manière
que l'API, au même "level", et en ajoutant les bonnes Correlation Ids. Cette configuration se fait en général dans le fichier
`src/init.ts`, dans la fonction `initComponents()`. Dans ce gabarit, vous trouverez un exemple qui configure un client HTTP
provenant de la librairie [@villemontreal/core-http-request-nodejs-lib](https://bitbucket.org/villemontreal/core-http-request-nodejs-lib)!

### Object complexe comme "message" à logger.

Il est possible de logger un objet javascript complexe au lieu d'une simple string, par exemple :

```typescript
logger.error({
  msg: 'my message',
  key1: {
    key3: 'val3',
    key4: 'val4'
  },
  key2: 'val2'
});
```

Il en va de même pour une _erreur à lancer_. Notez cependant que de lancer un objet complexe mais régulier
ne permettra pas d'obtenir de _stackTrace_! Par exemple :

```typescript
throw {
  msg: 'my message',
  key1: 'val1',
  key2: [111, 222]
};
```

Dans cet exemple, aucune stackTrace ne sera disponible et loggée.

C'est pourquoi nous recommendons, encore ici, d'utiliser le builder "`createError()`" et les autres méthodes
"`createXXXXX()`" fournies par le fichier `src/models/core/apiError.ts` pour créer un objet erreur à lancer.
Vous pouvez ajouter l'objet complexe à logger comme paramètre "`logMessage`". Par exemple :

```typescript
throw createError('SomeCode', {
  msg: 'my message',
  key1: 'val1',
  key2: [111, 222]
}).build();
```

Ou, pour ne pas avoir à spécifier un "code" :

```typescript
throw createServerError({
  msg: 'my message',
  key1: 'val1',
  key2: [111, 222]
}).build();
```

Finalement, si vous ne voulez/pouvez pas utiliser le builder "`createError()`", vous pouvez également
utiliser la classe native "`Error`" directement pour lancer une erreur qui comprendra une trackTrace :

```typescript
let error: any = new Error('my message');
error.key1 = 'val1';
error.key2 = [111, 222];
throw error;
```

Mais vous devrez alors déclarer votre objet comme étant "`any`", ou alors créer une classe custom qui étend
"`Error`", car les typings de cette classe ne permettent pas de propriétés customs.

---

## Gulp

Gulp est utilisé pour lancer les différentes tâches. Ce sont d'ailleurs des tâches Gulp
qui sont utilisées comme scripts dans `package.json`.

Le fichier principal de Gulp, `gulpfile.js` n'est qu'une indirection permetant
de définir les tâches Gulp en _TypeScript_ au lieu de Javascript.
Les tâches Gulp sont en fait définies dans `gulpcore.ts` et dans `gulpcore.dev.ts`.

Les tâches Gulp définies dans `gulpcore.dev.ts` sont uniquement disponibles lorsque les
dépendances *dev* ont été installées. Lorsque l'application roule dans Docker, les dépendances
dev ont été enlevées et donc seules les tâches définies dans `gulpcore.ts` seront disponibles
(en gros, seule `start` est disponible). C'est pourquoi l'application dans Docker est lancé
avec ce ceci comme "`CMD`" : `npm run start-no-dev-deps`...

Il y a une tâche un peu différente cependant : "_compile_". Cette tâche est exécutée directement
dans le fichier `gulpfile.js`, en Javascript. Ceci est compréhensible puisque c'est la transpilation
que "compile" effectue qui permet que les autres tâches puissent être écrites en TypeScript!

### Configurations spéciales pour les tests

Il est important de savoir qu'une task Gulp dont le nom commence par "`test-`" va s'exécuter 
avec la variable d'environnement "`NODE_APP_INSTANCE`" automatiquement initialisée à "`tests`". 
Ceci entraînera que le fichier de configuration "`config/local-tests.yaml`" sera utilisé lors de
ces tasks! Il est alors possible, dans ce fichier spécial, de spécifier des configurations 
spécifiquement fait pour être utilisées lors des tests.

Pour les curieux, c'est le fichier "`gulpfile.js`" qui s'occupe d'initialiser cette variable d'environnement
lorsque nécessaire.

### Déboguer une tâche Gulp

Si vous utilisez VSCode, une "_launch configuration_" est fournie permettant de déboguer une tâche Gulp :
"_`Debug a Gulp task`_". Il suffit de modifier cette configuration, dans le fichier _`.vscode/launch.json`_
pour y indiquer le nom de la tâche Gulp à déboguer, de sélectionner cette configuration dans le panel
"_Debug_" de VSCode, puis de faire un "_`[F5]`_" pour lancer le tout.

### Déboguer les tests

Si vous utilisez VSCode, une "_launch configuration_" est fournie permettant de déboguer les tests Mocha :
"_`Debug all tests`_". Il suffit de sélectionner cette configuration dans le panel
"_Debug_" de VSCode, puis de faire un "_`[F5]`_" pour lancer le tout.

### Déboguer un fichier de test spécifique

Si vous utilisez VSCode, une "_launch configuration_" est fournie permettant de déboguer un fichier de test
Mocha spécifique : "_`Debug a test file`_". Il suffit de modifier cette configuration, dans le fichier
_`.vscode/launch.json`_
pour y indiquer le path vers le fichier de test à déboguer, de sélectionner cette configuration dans le panel
"_Debug_" de VSCode, puis de faire un "_`[F5]`_" pour lancer le tout.

---

## Gestion des erreurs

La structure des erreurs retournées par l'API est basée sur les
[GuideLines de Microsoft](https://github.com/Microsoft/api-guidelines/blob/master/Guidelines.md#7102-error-condition-responses).

La gestion des erreurs est effectuée dans deux fichiers :

* _`src/core/errorManagement.ts`_ : y sont définies les routes qui serviront à "attapper" les erreurs. Il s'agit particulièrement
  d'une route pour attaper les "resources non trouvées" (404) et d''une route pour attraper toute autre erreur.
  Ces routes passent la balle au controller dédié qui les gérera :
* _`src/controllers/core/errorController.ts`_.

Lorsqu'une erreur survient, que ce soit une erreur système non attendue ou une erreur lancée manuellement, l'API retournera une réponse
consistant en l'object `IErrorResponse`. C'est cet object, avec un Content-Type `"application/json"`, que recevra
le client ayant effectué la requête.

`IErrorResponse` et les autres composants reliés aux erreurs sont définis dans le fichier _`src/models/core/apiError.ts`_. C'est là que sont
exportées les interfaces reliées aux erreurs ainsi que des fonctions permettant de construire facilement
une erreur.

Lorsque vous lancez une erreur par vous-même, il est recommandé d'utiliser la fonction _`createError()`_ qui est
exportée par le fichier _`src/models/core/apiError.ts`_. Cette fonction démarre un _builder_ permettant de facilement
construire l'erreur à lancer. On peut spécifier :

* Le message à logger
* Le niveau de log à utiliser
* Est-ce que la stack trace doit être loggée ou non. Pour un simple `404`, en général la stack trace est superflue.
* Le status HTTP à utiliser pour la réponse (ex: `404`)
* Le _code_ de l'erreur à utiliser. Ceci doit être une string constante et significative (ex: "`UserNotFound`").
* Le message _publique_ à utiliser dans l'erreur retournée. Si ce message publique n'est pas défini, un message générique sera utilisé.
* Des "`details`" et "`innererror`", tels que définis dans les
  [GuideLines de Microsoft](https://github.com/Microsoft/api-guidelines/blob/master/Guidelines.md#7102-error-condition-responses).

Note : ne pas oublier le `throw` et ne pas oublier d'appeller _`.build()`_ à la fin du processus de création de l'erreur! Par exemple :

```typescript
throw createError('SomeCode', 'A log message')
  .httpStatus(HttpStatusCodes.NOT_IMPLEMENTED)
  .build();
```

Pour lancer une erreur `404`, lorsqu'une resource n'est pas trouvée dans un controller, vous pouvez utilisez la
fonction _`createNotFoundError()`_, aussi exportée par _`src/models/core/apiError.ts`_. Cette fonction gère automatiquement
certains paramètres spécifiques à l'erreur "Not Found".

Même chose pour lancer une erreur relative à des paramètres invalides : il est possible de directement utiliser la
fonction _`createInvalidParameterError()`_ au lieu de constuire l'erreur from scratch.

Quelques autres erreurs prédéfinies sont également fournies : _`createServerError()`_, _`createNotImplementedError()`_,
_`createUnauthorizedError()`_ et _`createForbiddenError()`_.

---

## Open API / Swagger

[Open API](https://www.openapis.org/), aussi connu sous le nom [Swagger](http://swagger.io/), est une spécification
qui permet de documenter une API REST (ses endpoints, les paramètres, les types de retour, etc). Une API fournissant
un fichier de specs Open API est documentée d'une manière standardisée et peut être consommée facilement
par des clients connaissant Open API.

Il y a beaucoup, beaucoup de manières différentes de travailler avec Open API et beaucoup de librairies/plugins proposant
une méthode particulière. Ce qui est commun à toutes les approches est, qu'au bout du compte, l'API
fournit un endpoint servant un fichier YAML ou Json respectant la spec Open API et décrivant l'API. On appelle ce
fichier le "_fichier de specs Open API_" de l'application.

Présentement, dans ce gabarit, les fichiers reliés à Open API sont situés dans le répertoire _`open-api`_, à la racine du projet.
Le fichier _`open-api.yaml`_ est le fichier de specs lui-même, décrivant l'API. Le fichier _`openApiConfigurer.ts`_ contient le code
permettant d'enregistrer des routes reliées à Open API (routes décrites plus bas), le fichier _`openApiValidator.ts`_ est utilisé
pour valider le fichier de specs et, finalement, _`swagger-editor-config.json`_ est le fichier de config pour l'éditeur Swagger
(inclu dans le gabarit).

Les routes enregistrées par _`open-api.ts`_ sont, par défaut :

* _`/v1/specification`_ : sert le fichier de specs lui-même (_`open-api.yaml`_). Notez que les éléments "`host`", "`schemes`"
  et "`basePath`" sont _automatiquement générés_ et ajoutés au fichier servi! En fait, si vous tentez de les ajouter au fichier
  _`open-api.yaml`_ directement, ils seront overwrittés.

* _`/v1/ui`_ : sert [Swagger UI](http://swagger.io/swagger-ui/), une interface web présentant de manière "friendly"
  la spec Open API de l'API. Cette interface permet aussi de tester les endpoints de l'API.

* _`/v1/editor`_ : sert [Swagger Editor](http://swagger.io/swagger-editor/), un éditeur fait spécifiquement pour
  modifier le fichier de specs Open API de l'API. Les modifications effectuées dans cet éditeur seront automatiquement
  sauvegardées dans le fichier _`open-api.yaml`_ (sauf les éléments "`host`", "`schemes`" et "`basePath`"!). Il est possible de lancer
  l'éditeur en mode "standalone", sans lancer l'application elle-même, en utilisant la commande "_`gulp editor`_".

Notez que nous avons testé _beaucoup_ de solutions Swagger disponibles et nous sommes très au courant des librairies
qui génèrent automatiquement les routes et qui valident automatiquement les requêtes reçues, en utilisant le fichier
de specs. Cela dit, nous n'avons pas encore statué sur la meilleure approche à utiliser... Certaines de ces solutions sont
très intrusives et forcent une structure précise pour l'application. Aussi, nous désirons conserver le contrôle
sur la structure des erreurs retournées : certains plugins validant automatiquement les paramètres reçus
ne permettent pas un tel contrôle.

Pour le moment, la manière de travailler suggérée est de mettre à jour le fichier de specs _`open-api.yaml`_
manuellement ou en utilisant le Swagger Editor inclu dans le gabarit. Il faut aussi définir les routes de cet
API dans le fichier _`src/routes.ts`_ de l'application. Lorsque le serveur est lancé, une validation est effectuée
(en utilisant entre autre [Swagger Parser](http://bigstickcarpet.com/swagger-parser)) pour s'assurer que les
routes définies dans le fichier de specs et celles définies dans _`src/routes.ts`_ sont bien synchronisées.

---

## Appels HTTP

Si votre API doit effectuer des appels HTTP à une autre API, il est recommadé d'utiliser [SuperAgent](https://github.com/visionmedia/superagent) pour bâtir les requêtes
et la fonction "`send(...)`" fournie par la librairie [@villemontreal/core-http-request-nodejs-lib](https://bitbucket.org/villemontreal/core-http-request-nodejs-lib)
pour la lancer. Cette fonction "`send()`" va automatiquement ajouter la _Correlation Id_ courante lors d'un appel, et loggera aussi des informations utiles au déboguage en utilisant des loggers configurés de manière approriée.

La librairie [@villemontreal/core-http-request-nodejs-lib](https://bitbucket.org/villemontreal/core-http-request-nodejs-lib) doit être configurée avant
d'être utilisée. Ceci est effectué dans le fichier `src/init.ts`, dans la fonction `initComponents()`.
La librairie a besoin de deux choses : de la fonction locale de création de Loggers, "`createLogger`", ainsi que d'un "provider" de Correlation Ids. Par exemple :

```typescript
import { init as initHttpUtils } from '@villemontreal/core-http-request-nodejs-lib';
import { createLogger } from './utils/logger';
import { correlationIdService } from '@villemontreal/core-correlation-id-nodejs-lib';

// ...

export async function initComponents() {
  initHttpUtils(createLogger, () => {
    return correlationIdService.getId();
  });
  // ...
}
```

---

## Base de données - Structure de données

L'API de la solution AGIR-Planification utilise une base de données non-relationnelle (MongoDB).
Il est important de documenter correctement chaque base de données utilisée dans une solution logicielle. Pour cela, deux types de modèle ont été générés :

* Un modèle relationnel, afin de présenter les relations entre les collections de la base de données.
Même si la solution utilise actuellement une base de données non-relationnelle, il existe tout de même quelques relations (déclarées ou non déclarées) entre les collectioons de données.
* Un modèle physique de données, afin de présenter l'intégraté des données persistées.
La base de données Mongo est très permissive en permettant d'ajouter de nouveaux attributs (nouvelles données) dynamiquement. Il est donc très important de documenter les données persistées.

Ces deux modèles doivent être maintenu au cours des futures activités de développement :

* Ajout ou suppression d'une collection dans la base de données
* Ajout ou suppression d'un attribut dans une collection
* ...

Pour générer ces modèles de données, il a été décidé d'utiliser la solution open-source [PlantUML](https://plantuml.com/fr/).
Pour modifier les scripts PlantUML, nous recommandons d'utiliser l'outil web suivant : https://www.planttext.com/.

Vous trouverez les scripts PlantUML dans le dossier **database_model**.
Dans le sous-dossier **relational_data_model**, vous trouverez le fichier *relational_data_model_plantuml_script* contenant le script PlantUML générant le modèle relationnel de la base de données.
Dans le sous-dossier **physical_data_model**, vous trouverez quatre scripts PlantUML générant le modèle physique de données :

* Le fichier *physical_data_model_plantuml_script-projects* définit le modèle physique de données pour la collection *Projects*.
* Le fichier *physical_data_model_plantuml_script-interventions* définit le modèle physiqye de données pour la collection *Interventions*.
* Le fichier *physical_data_model_plantuml_script-programbooks* définit le modèle physique de données pour la collection *ProgramBooks*.
* Le fichier *physical_data_model_plantuml_script-others* définit le modèle physique de données pour les collections restantes.

La base de données contenant un certain nombre de collections dont la majorité d'entre elles étant de taille significativement grande, il a été décidé de séparer en quatre le modèle physique de données.

Les modèles de données sont aussi accessibles sur Confluence dans la page suivante : https://confluence.montreal.ca/pages/viewpage.action?pageId=121588762.

---

### À revisiter à nouveau dans le futur :

* [InversifyJS](https://github.com/inversify/InversifyJS) - Pour une approche par Injection de dépendances.

* [Tsoa](https://github.com/lukeautry/tsoa) - approche _bottom-up_ par excellence, qui génère automatiquement le fichier
  de specs en utilisant certains `decorators` et le fait que TypeScript est typé statiquement.

* [routing-controllers](https://github.com/pleerock/routing-controllers) - Aussi basé sur des `decorators`, les routes
  sont générées en annotant les méthodes de controllers. Ne supporte pas la génération de specs Open API (à ce jour).

* [LoopBack](http://loopback.io/) - Développé par IBM au même titre qu'Express.

---

# TODO prochains trucs sur la liste / à explorer

* Validation (Json Schema / [class-validator](https://github.com/pleerock/class-validator) )

---

|
:-----:|
|Projet débuté en utilisant le générateur : _[mtl-node-api](https://bitbucket.org/villemontreal/generator-mtl-node-api)_


## Liaison du projet AGIR Work Planning Lib pour le développement

Avant de faire la liaison de la lib, assurez-vous de suivre les instructions _Link_ du README dans _agir-work-planning-lib_.
Exécutez `npm run link-lib` pour lier votre paquet _agir-work-planning-lib_ local.
Exécutez `npm run unlink-lib` pour dissocier le paquet _agir-work-planning-lib_ local et réinstaller le paquet publié.
