FROM node:8.9

#RUN apk add --no-cache bash    // this for alpin

WORKDIR /var/www/planarsys

COPY docker-entrypoint.sh /usr/local/bin/
RUN ln -s usr/local/bin/docker-entrypoint.sh /entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
