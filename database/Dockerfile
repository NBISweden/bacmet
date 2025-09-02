FROM alpine:latest

RUN apk add --no-cache \
	sqlite~3 \
	miller~6

ARG UID=1000
RUN adduser -D -u "$UID" bacmet

USER "$UID"

WORKDIR /home/bacmet

# Data volume mount point.
RUN install -d -o "$UID" data/

COPY --chown=$UID sql/ ./sql/
COPY --chown=$UID scripts/ ./scripts/
RUN chmod 755 scripts/*.sh
RUN mv scripts/start-script.sh .

ENV DATABASE=/home/bacmet/data/database.db

CMD ./start-script.sh
