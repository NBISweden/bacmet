# BacMet

## Getting started

To get started running this project you need to get through the
following steps:

- [Install docker and docker compose](https://www.docker.com/) or other
  container runtime alternatives
- [Perform `Data import`](#data-import)
- [Start the app](#start-the-app)
- View the app on http://localhost:5000/

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
scratch. In reality, the `down -v` step is not actually needed:

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

### Start the app

The app can be started in a production-like environment or in an
environment tuned for convenient development. When you are switching
between environments it is important to remember to rebuild the
container so either use the `build` command or add the flag `--build`.

#### Start production-like environment

The production-like environment will copy all necessary app related code
and assets into the container in order to create a self contained
deployable container.

``` sh
docker compose up --build
```

#### Start development environment

The development environment will mount the `app` directory and
automatically reload code when it is changed.

``` sh
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

### Run tests

Tests can only be run in the development docker container since the HTML
validation requires `openjdk`. The tests can be run by using the
following command:

``` sh
docker compose -f docker-compose.yml -f docker-compose.dev.yml run --rm app pytest -p no:cacheprovider app/tests
```
