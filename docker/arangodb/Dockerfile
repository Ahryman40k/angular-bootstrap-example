FROM arangodb

COPY ./data/initdb.js /docker-entrypoint-initdb.d/

EXPOSE 8529
CMD ["arangod"]