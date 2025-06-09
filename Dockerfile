FROM alpine:latest

RUN apk add --no-cache \
	sqlite~3 \
	miller~6

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
COPY --chmod=755 scripts/import-validated-compounds.sh scripts/
COPY --chmod=755 scripts/import-validated-pdb-files.sh scripts/
COPY --chmod=755 scripts/import-predicted-unique-homologues.sh scripts/
COPY --chmod=755 scripts/import-predicted-groups.sh scripts/
COPY --chmod=755 scripts/import-sensitivity-distributions.sh scripts/

ENV DATABASE=/data/database.db

CMD [ "scripts/import-all.sh" ]
