# BacMet

## Getting started

To get started running this project you need to get through the
following steps:

- [Install Docker and Docker Compose](https://www.docker.com/)
- [Start the app](#start-the-app)
- [Perform `Data import`](#data-import)
- View the app on http://localhost:5000/ or at the address and port
  defined by the environment variables `APP_HOST` and `APP_PORT`.

### Start the app

The app can be started in a production-like environment or in an
environment tuned for convenient development. When you are switching
between running the app in different environments, it is important to
remember to rebuild the container, so use either the
`docker compose [...] build` command or add the `--build` option to the
`docker compose [...] up` command.

By setting the environment variables `APP_HOST` and `APP_PORT`, you can
change the address and port where the app will be available. The default
is `0.0.0.0:5000` (port 5000 on all available interfaces).

#### Start production-like environment

The production-like environment will copy all necessary app related code
and assets into the container in order to create a self contained
deployable container.

``` sh
docker compose up --build
```

By setting the environment variable `DOCKER_HOST` to some host and port
(e.g., `server.example.com:2375`), you can deploy the app to a remote
Docker host, assuming that the Docker daemon on that host [is configured
to accept remote
connections](https://docs.docker.com/engine/daemon/remote-access/).

#### Start development environment

The development environment will mount the directories that contain the
code for the backend and for the frontend into the container, so that
changes to the code on the host immediately are reflected in the running
container.

``` sh
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Since the development environment mounts a couple of directories from
the host, you will not be able to run it on a remote Docker host (i.e.,
`DOCKER_HOST` should not be set).

### Data import

The original data should be fetched from the server at Chalmers and be
put in a directory called `data-import`, replicating the directory
structure on the Chalmers server (see below).

The data is imported into the persistent SQLite database
`/data/database.db` by copying the `data-import` directory into the
running `app` containers persistent volume. This can be done at any
time, and copying updated data (or the same old data a further time)
will cause the already imported data to be discarded.

This shows how to explicitly throw the old data away and reload it from
scratch. Note that `DOCKER_HOST` is required to be set if you are
running the container on a remote Docker host.

``` shell
docker compose down -v
docker compose up -d

docker compose cp data-import app:/home/bacmet/data/
```

By observing the container log (`docker compose logs -f`), you should be
able to follow the service noticing that new data is available,
importing it (in several steps), and then finally restarting the
service.

#### Fetching updated data

Fetching the data is easiest done using `rsync`:

``` shell
rsync --progress --stats -h -ia --delete \
    user@server:/remote-path/NBIS/ data-import/
```

#### Expected layout of data-import directory

``` none
data-import
├── 1-Experimentally_validated
│   ├── 1-BacMet_experimentally_validated_database_3.0.csv
│   ├── 2-BacMet_compound_CAS_numbers.csv
│   ├── BacMet_nt_sequences.fasta
│   ├── BacMet_v3_proteins.fasta
│   └── Experimentally_validated_PDB_files.zip
├── 2-Predicted_database
│   ├── 1-Predicted_unique_homologues.zip
│   ├── 2-Predicted_unique_homologous_sequences.zip     # (not used)
│   └── 3-Predicted_groups.zip
└── 3-Sensitivity_distributions
    ├── MIC_Biocides.zip
    ├── MIC_metals.zip
    └── MIC_other_compounds.zip

4 directories, 11 files
```
