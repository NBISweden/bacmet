#!/bin/sh -

set -u

PATH=$HOME/scripts:$PATH

# The database is created if it does not exist, and recreated if
# the environment variable DATABASE_REINIT is set to some value.

if [ ! -f "$DATABASE" ] || [ -n "${DATABASE_REINIT:-}" ]
then
	echo 'Initializing database.' >&2
	rm -f "$DATABASE"
	sqlite3 "$DATABASE" <sql/schema.sql
fi

import-validated-compounds.sh \
	/data-import/1-Experimentally_validated/2-BacMet_compound_CAS_numbers.csv

import-validated.sh \
	/data-import/1-Experimentally_validated/1-BacMet_experimentally_validated_database_3.0.csv

import-validated-pdb-files.sh \
	/data-import/1-Experimentally_validated/Experimentally_validated_PDB_files.zip

import-predicted-unique-homologues.sh \
	/data-import/2-Predicted_database/1-Predicted_unique_homologues.zip

import-predicted-groups.sh \
	/data-import/2-Predicted_database/3-Predicted_groups.zip

import-sensitivity-distributions.sh \
	/data-import/3-Sensitivity_distributions/MIC_*.zip

#echo 'Vacuuming database...' >&2
#sqlite3 "$DATABASE" vacuum
