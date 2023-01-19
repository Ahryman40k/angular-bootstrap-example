#==========================================
# Note : The "alpine" version doesn't work with Mongo mainly
# because we use MockGoose for testing.
# Note : The "alpine,slim" version doesn't work with mongodb-memory-server
# https://nodkz.github.io/mongodb-memory-server/docs/guides/integration-examples/docker
#==========================================
FROM node:14.19.3

LABEL maintainer="Ville De Montreal"
ARG ENV=unknown
ARG GIT_COMMIT=unknown

# GIT label of the packaged code
LABEL GIT_COMMIT=${GIT_COMMIT}

# Work dir
WORKDIR /mtl/app

# Copies the project files
COPY . /mtl/app

RUN rm /bin/sh && ln -s /bin/bash /bin/sh && \
    echo "America/Montreal" > /etc/timezone && dpkg-reconfigure -f noninteractive tzdata && \
    apt-get update && \
    apt-get clean all && \
    apt-get -y autoremove --purge && \
    rm -rf /var/lib/apt/lists/* && \
    chown -R node:node /mtl/app/

USER node

RUN npm install --only=production --no-cache && \
    cp -a /mtl/app/node_modules /tmp/node_modules && \
    npm install --no-cache && \
    npm run compile && \
    rm -rf /mtl/app/node_modules && \
    mv /tmp/node_modules /mtl/app/node_modules

# Ports to expose:
# - HTTP server
# - Debugging port (if required)
EXPOSE 12345 5858

# Runs the application, when the container starts.
# The compilation is already done and the dev
# dependencies are not available.
CMD ["npm", "run", "start-no-dev-deps"]
