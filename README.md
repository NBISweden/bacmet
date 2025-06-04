# bacmet

## Data import

The original data should be fetched from the server at Chalmers and
be put in a directory called `data-import`, replicating the directory
structure on the Chalmers server (see below).

The data is imported into the persistant SQLite database
`/data/database.db` in the `database` container when the service is
brought up and the database is missing or empty.

The data can be reimported by removing the database’s Docker volume
and restarting the service. This will cause the database to be recreated
and the data to be imported:

``` shell
docker compose down -v
docker compose up
```

The database will also be recreated and the data reimported if the
environment variable `DATABASE_REINIT` has a non-empty value when the
service is started.

``` shell
DATABASE_REINIT=1 docker compose up
```

### Fetching updated data

Fetching the data is easiest done using `rsync`:

``` shell
rsync --progress --stats -h -ia --delete \
    user@server:/remote-path/NBIS/ data-import/
```

### Expected layout of data-import directory

``` none
data-import
├── 1-Experimentally_validated
│   ├── 1-BacMet_experimentally_validated_database_3.0.csv
│   ├── 2-BacMet_compound_CAS_numbers.csv
│   └── Experimentally_validated_PDB_files.zip
├── 2-Predicted_database
│   ├── 1-Predicted_unique_homologues.zip
│   ├── 2-Predicted_unique_homologous_sequences.zip
│   └── 3-Predicted_groups.zip
└── 3-Sensitivity_distributions
    ├── MIC_Biocides.zip
    ├── MIC_metals.zip
    └── MIC_other_compounds.zip

4 directories, 9 files
```
