FROM node:14.19.3
LABEL maintainer="Ville De Montreal"
ARG ENV=dev
ARG INSTANCE=
ARG GIT_COMMIT=unknown

# GIT label of the packaged code
LABEL GIT_COMMIT=${GIT_COMMIT}

# Bundle app source
ENV NODE_ENV=${ENV}
ENV NODE_APP_INSTANCE=${INSTANCE}

#creation build folder
COPY . /usr/src/build

# Create app directory
RUN mkdir -p /usr/src/app && \
  mkdir -p /usr/src/build && \
  echo "America/Montreal" > /etc/timezone && dpkg-reconfigure -f noninteractive tzdata && \
  #
  # Build du SPA et copie dans le répertoires 'sites'
  cd /usr/src/build && \
  npm install --no-progress && \
  npm run build:${ENV} && \
  cp -r /usr/src/build/dist/agir-work-planning-web/ /usr/src/app/sites/ && \
  #
  # Installation du serveur web à la racine
  cd /usr/src/app && \
  cp -r /usr/src/build/server/ /usr/src/app && \
  cd /usr/src/app/server && \
  npm install --no-progress && \
  #
  ## On efface les nodes modules par soucis d'espace mais on laisse les sources pour l'exécution des tests
  rm -fr /usr/src/build/node_modules

WORKDIR /usr/src/app/server

# Lanch server
EXPOSE 4200
CMD ["node", "server.js"]
