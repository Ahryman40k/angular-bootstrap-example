# Cette image docker sert uniquement à l'exécution des tests pour tester la librairie
FROM node:14.18.0-alpine

LABEL maintainer="Ville De Montreal"
ARG ENV=unknown
ARG GIT_COMMIT=unknown

# GIT label of the packaged code
LABEL GIT_COMMIT=${GIT_COMMIT}

# Work dir
WORKDIR /mtl/app

# Copies the project files
COPY . /mtl/app

RUN apk add --update bash nano tzdata && \
  rm -rf /var/cache/apk/* && \
  # 
  # Sysadmin prefs
  rm /bin/sh && ln -s /bin/bash /bin/sh && \
  printf "\\nalias ll=\"ls -la\"\\n" > ~/.bashrc && \
  #
  # Ajustement des fuseaux horaire
  cp /usr/share/zoneinfo/America/Montreal /etc/localtime && \
  echo "America/Montreal" > /etc/timezone && \
  #
  # Installation des outils de compilation et compilation
  npm install --no-cache && \
  npm run compile
