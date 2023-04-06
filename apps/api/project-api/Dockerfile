# https://snyk.io/blog/10-best-practices-to-containerize-nodejs-web-applications-with-docker/
FROM alpine

# https://engineeringblog.yelp.com/2016/01/dumb-init-an-init-for-docker.html
RUN apk update && apk add --update nodejs && apk add --update npm &&  apk add --update dumb-init

RUN adduser -D node

ENV NODE_ENV production

WORKDIR /usr/app
COPY --chown=node:node /dist/apps/api/project-api/ /usr/app

RUN npm i

USER node
CMD ["dumb-init", "node", "main.js"]