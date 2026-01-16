#!/bin/sh -

set -u

PATH=$HOME/db-scripts/scripts:$PATH

# The database is created if it does not exist.

if [ ! -f "$DATABASE" ]; then
	echo 'Initializing database.' >&2
	sqlite3 "$DATABASE" <"$HOME/db-scripts/sql/schema.sql"
fi

# We expect to see the data to import in the directory called "import"
# in the same directory where the database is stored.

if [ ! -d "$IMPORT_DIR" ]; then
	printf 'Failed to import data from "%s"\n' "$IMPORT_DIR" >&2
	exit 1
fi

import-validated-compounds.sh \
	"$IMPORT_DIR"/1-Experimentally_validated/2-BacMet_compound_CAS_numbers.csv

import-validated.sh \
	"$IMPORT_DIR"/1-Experimentally_validated/1-BacMet_experimentally_validated_database_3.0.csv

import-validated-sequence-files.sh \
	"$IMPORT_DIR"/1-Experimentally_validated/BacMet_nt_sequences.fasta \
	"$IMPORT_DIR"/1-Experimentally_validated/BacMet_v3_proteins.fasta

import-validated-pdb-files.sh \
	"$IMPORT_DIR"/1-Experimentally_validated/Experimentally_validated_PDB_files.zip

import-predicted-unique-homologues.sh \
	"$IMPORT_DIR"/2-Predicted_database/1-Predicted_unique_homologues.zip

import-predicted-groups.sh \
	"$IMPORT_DIR"/2-Predicted_database/3-Predicted_groups.zip

import-sensitivity-distributions.sh \
	"$IMPORT_DIR"/3-Sensitivity_distributions/MIC_*.zip
