FROM alpine:latest

RUN apk add --no-cache \
	sqlite~3

RUN adduser -D database

RUN mkdir -m 775 /data
RUN chown database /data

USER database
WORKDIR /home/database

RUN mkdir scripts
RUN mkdir sql

COPY --chmod=644 sql/schema.sql sql/
COPY --chmod=755 scripts/import-data.sh scripts/
COPY --chmod=755 scripts/import-pdb-data.sh scripts/

ENV DATABASE=/data/database.db

RUN sqlite3 "$DATABASE" <sql/schema.sql

CMD [ "scripts/import-data.sh" ]
