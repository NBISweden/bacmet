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
COPY --chmod=755 scripts/import-all.sh scripts/
COPY --chmod=755 scripts/import-validated.sh scripts/
COPY --chmod=755 scripts/import-validated-pdb-files.sh scripts/
COPY --chmod=755 scripts/import-predicted_unique_homologues.sh scripts/
COPY --chmod=755 scripts/import-predicted_groups.sh scripts/

ENV DATABASE=/data/database.db

CMD [ "scripts/import-all.sh" ]
