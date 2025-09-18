#!/bin/sh

set -u

# shellcheck disable=SC2153
database=$DATABASE
nucleotide_data=$1
protein_data=$2

echo 'Importing sequence files...' >&2

if [ ! -f "$database" ]; then
    printf 'Database "%s" not found.\n' "$database" >&2
    exit 1
fi

count=$(
	sqlite3 "$database" <<-'SQL'
		SELECT COUNT(*) FROM sequences;
	SQL
)

if [ "$count" -gt 0 ]; then
	echo 'Data is already loaded.' >&2
	exit 0  # not an error
fi

tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT INT TERM

# Helper function to convert FASTA to CSV.
fasta_to_csv () {
	awk '
		function output() {
			if (id != "") printf("%s,\"%s\"\n", id, data)
		}

		/^>/ {
			output()
			match($0, "\\<[A-Z][A-Z0-9_]+\\.[0-9]\\>")
			id = substr($0, RSTART, RLENGTH)
			data = $0
			next
		}

		{ data = data ORS $0 }

		END { output() }'
}

# Process sequences.
fasta_to_csv  <  "$nucleotide_data"  >  "$tmpdir/data-n.csv"
fasta_to_csv  <  "$protein_data"     >  "$tmpdir/data-p.csv"

echo 'Loading data into database...' >&2

cat <<-SQL >"$tmpdir/import.sql"
	.mode csv
	PRAGMA temp_store = MEMORY;

	CREATE TEMPORARY TABLE import_n (
		name TEXT NOT NULL,
		sequence TEXT NOT NULL
	);
	CREATE TEMPORARY TABLE import_p (
		name TEXT NOT NULL,
		sequence TEXT NOT NULL
	);
	CREATE TEMPORARY TABLE import_tmp (
		name TEXT NOT NULL,
		sequence TEXT NOT NULL,
		sequence_id INTEGER NOT NULL,
		type TEXT NOT NULL,

		PRIMARY KEY (sequence_id)
	);

	.import "$tmpdir/data-n.csv" import_n
	INSERT INTO import_tmp (name, sequence, type)
	SELECT name, sequence, 'n'
	FROM import_n;

	.import "$tmpdir/data-p.csv" import_p
	INSERT INTO import_tmp (name, sequence, type)
	SELECT name, sequence, 'p'
	FROM import_p;

	INSERT INTO sequences (sequence_id, sequence)
	SELECT sequence_id, sequence
	FROM import_tmp;

	UPDATE validated
	SET nucleotide_sequence_id = (
		SELECT sequence_id FROM import_tmp
		WHERE type = 'n' AND name = validated.protein_accession_ncbi
	);
	UPDATE validated
	SET protein_sequence_id = (
		SELECT sequence_id FROM import_tmp
		WHERE type = 'p' AND name = validated.protein_accession_ncbi
	);
SQL

sqlite3 "$database" <"$tmpdir/import.sql"

echo 'Done.' >&2
