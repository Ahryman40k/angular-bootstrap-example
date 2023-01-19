# Cette image docker sert uniquement à l'exécution des tests pour tester la librairie 
FROM node:14-stretch-slim

LABEL maintainer="Ville De Montreal" 
ARG ENV=unknown 
ARG GIT_COMMIT=unknown 

# GIT label of the packaged code 
LABEL GIT_COMMIT=${GIT_COMMIT} 

# Copies the project files 
COPY . /usr/src/build

RUN cd /usr/src/build && \
  ln -fs /usr/share/zoneinfo/America/Montreal /etc/localtime && \
  dpkg-reconfigure -f noninteractive tzdata && \
  apt-get update && \
  # apt-get install -y node-gyp curl && \
  apt-get clean all && \
  #
  # installation
  npm install --no-progress --no-cache && \ 
  npm run build-lib

WORKDIR /usr/src/build/dist/gis-components-lib/