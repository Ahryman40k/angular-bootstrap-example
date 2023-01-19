# CONTRIBUTING

## Processus de développement

Pour tout projet de développement, il est impératif de suivre le [processus de développement](https://www.lucidchart.com/documents/view/678a4dac-e04e-49ab-87e3-5ed2527d2c64) établi par le service des technologies de l'informations.

## Critères d'acceptation des livrables

### Général (Directives générales à tous les types de mandat)

- Le code, ainsi que les commentaires et la documentation intégrés dans le code, doivent être rédigés en anglais.

- Le code, ainsi que l’historique complet des révisions, est déposé sur le dépôt de sources de la Ville de Montréal attitré au projet.

- Le développement s’effectue selon le flux de travaux de la Ville de Montréal (basé sur [Git Flow](https://datasift.github.io/gitflow/IntroducingGitFlow.html)).

- Le code écrit dans le cadre de la prestation de service, ainsi que ses dépendances(code, image, documentation, etc.), doivent être compatible avec la licence MIT (Massachusetts Institute of Technology). Par exemple, la licence GPL (GNU General Public License) ne l’est pas.

- La Ville de Montréal est l’unique détenteur des droits d’auteur pour l'ensemble des livrables(code, image, documentation, etc.) créés dans le cadre de la prestation de service.

- La solution doit s’assurer de ne pas présenter de failles de sécurité telles que décrites par [OWASP](https://www.owasp.org)

#### Une fonctionnalité est terminée lorsqu'elle respecte les points suivants :

- Le code a été soumis via un pull request sur le dépôt de sources de la Ville de Montréal.

- Le prestataire de services a effectué une revue de code à l’interne via le pull request du dépôt de sources de la Ville de Montréal avant que le code ne soit révisé par la Ville de Montréal.

- La Ville de Montréal a accepté le pull request.

- Tous les tests automatisés passent sur le serveur de build.

- Tous les critères d’acceptation sont respectés et il est possible de le démontrer.

- Le code ne contient pas de données sensibles (ex. : mot de passe).

#### La Ville de Montréal se donne le droit de refuser du code si :

- Le code n’est pas testé adéquatement. Chaque fonction de traitement (fonction qui effectue du calcul ou une transformation) doit faire l'objet de tests unitaires automatisés.

- Le code n'est pas documenté adéquatement.

- Le code n'est pas maintenable.

- Le code n'est pas sécuritaire.

- La modularité du code n’est pas adéquate.

### Directives spécifiques au développement d'APIs

#### Général

- La plateforme utilisée est Node.js.

- Le langage de programmation utilisé est TypeScript.

- L’API est basé sur la version la plus récente du [gabarit d’API de la Ville de Montréal](https://bitbucket.org/villemontreal/generator-mtl-node-api)

- L'API doit s'exécuter dans un conteneur Docker.

- Le prestataire de services doit mettre en place une suite de tests automatisés pour les tests unitaires, fonctionnels, d’intégration, de charge, de volumétrie, de sécurité, etc.

- Tout changement au design de l’API doit avoir été préalablement approuvé par l’architecte de la Ville de Montréal attitré au projet.

#### Avant de commencer un jalon important du projet

- Le design de l’API a été approuvé par le comité de design d'APIs.

#### Une fonctionnalité est terminée lorsqu'elle respecte les points suivants :

- Le code respecte les règles TSLint définies par le gabarit d’API de la Ville de Montréal.

- La documentation de l’API au format Swagger/OpenAPI est complète.

- Le design de l’API est conforme aux [standards définis par la Ville de Montréal](https://sticonfluence.interne.montreal.ca/display/AES/REST+API)

- Le déploiement de la fonctionnalité vers les environnements de développement, d’acceptation et de production est automatisé avec Jenkins.

- Les migrations de bases de données sont scriptées.

#### Suite à un jalon important du projet

- La documentation sur l’architecture haut niveau est à jour dans Confluence.
