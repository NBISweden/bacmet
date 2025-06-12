# bacmet



## Getting started

To get started running this project you need to get through the following steps:

- [Install docker and docker compose](https://www.docker.com/) or other container runtime alternatives
- [Perform `Data import`](#data-import)
- [Start the app](#start-the-app)
- View the app on http://localhost:5000/


### Data import

The original data should be fetched from the server at Chalmers and
be put in a directory called `data-import`, replicating the directory
structure on the Chalmers server (see below).

The data is imported into the persistent SQLite database
`/data/database.db` in the `database` container when the service is
brought up and the database is missing or empty.

The data can be reimported by removing the database’s Docker volume
and restarting the service. This will cause the database to be recreated
and the data to be imported:

``` shell
docker compose --profile load-data down -v
docker compose --profile load-data up database
```

The database will also be recreated and the data reimported if the
environment variable `DATABASE_REINIT` has a non-empty value when the
service is started.

``` shell
DATABASE_REINIT=1 docker compose --profile load-data up database
```

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
│   └── Experimentally_validated_PDB_files.zip
├── 2-Predicted_database
│   ├── 1-Predicted_unique_homologues.zip
│   ├── 2-Predicted_unique_homologous_sequences.zip     # (not used)
│   └── 3-Predicted_groups.zip
└── 3-Sensitivity_distributions
    ├── MIC_Biocides.zip
    ├── MIC_metals.zip
    └── MIC_other_compounds.zip

4 directories, 9 files
```

### Start the app

The app can be started in a production like environment or a an environment tuned for convenient development. When you are switching between environments it is important to remember to rebuild the container so either use the `build` command or add the flag `--build`.

#### Start production like environment

The production like environment will copy all necessary app related code and assets into the container in order to create a self contained deployable container.

```sh
docker compose up --build
```


#### Start development environment

The development evironment will mount the `app` directory and automatically reload code when it is changed.

```sh
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```
