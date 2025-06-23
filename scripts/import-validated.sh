#!/bin/sh

set -u

database=$DATABASE

echo 'Importing experimentally validated data.' >&2

if [ ! -f "$database" ]; then
	printf 'Database "%s" not found\n' "$database" >&2
	exit 1
fi

count=$(
	sqlite3 "$database" <<-'SQL'
		SELECT COUNT(*) FROM validated;
	SQL
)

if [ "$count" -gt 0 ]; then
	echo 'Data is already loaded.' >&2
	exit 0	# not an error
fi

tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT INT TERM
# This data needs to be preprocessed to remove charecters that are not
# UTF-8.
iconv -c -t UTF-8 "$1" >"$tmpdir/data.csv"

echo 'Loading data into database...' >&2

cat <<-'SQL' >"$tmpdir/import.sql"
	.mode csv
	PRAGMA temp_store = MEMORY;
	CREATE TEMPORARY TABLE import_tmp (
		bacmet_id TEXT NOT NULL,
		gene_name TEXT NOT NULL,
		code_for TEXT NOT NULL,
		family TEXT NOT NULL,
		protein_accession_ncbi TEXT NOT NULL,
		nucleotide_accession_ena_embl TEXT NOT NULL,
		protein_accession_uniprot TEXT NOT NULL,
		organism TEXT NOT NULL,
		location TEXT NOT NULL,
		type_of_compounds TEXT NOT NULL,
		compound TEXT NOT NULL,
		description TEXT NOT NULL,
		length_aa INTEGER NOT NULL,
		reference TEXT NOT NULL,

		UNIQUE (bacmet_id)
	);
SQL

printf '.import --skip 1 %s import_tmp\n' "$tmpdir/data.csv" >>"$tmpdir/import.sql"

cat <<-'SQL' >>"$tmpdir/import.sql"
	INSERT INTO validated (
		bacmet_id, gene_name, code_for, family,
		protein_accession_ncbi, nucleotide_accession_ena_embl,
		protein_accession_uniprot, organism, location,
		type_of_compounds, compound, description, length_aa,
		reference
	)
	SELECT 
		bacmet_id, gene_name, code_for, family,
		protein_accession_ncbi, nucleotide_accession_ena_embl,
		protein_accession_uniprot, organism, location,
		type_of_compounds, compound, description, length_aa,
		reference
	FROM import_tmp;
SQL

sqlite3 "$database" <"$tmpdir/import.sql"

echo 'Done.' >&2
