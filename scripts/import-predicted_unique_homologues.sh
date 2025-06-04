#!/bin/sh

set -u

database=$DATABASE
data_zip_archive=$1

echo 'Importing predicted unique homologues.' >&2

if [ ! -f "$database" ]; then
	printf 'Database "%s" not found\n' "$database" >&2
	exit 1
fi

count=$(
	sqlite3 "$database" <<-'SQL'
		SELECT COUNT(*) FROM predicted_unique_homologues;
	SQL
)

if [ "$count" -gt 0 ]; then
	echo 'Data is already loaded.' >&2
	exit 0	# not an error
fi

tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT INT TERM
echo 'Extracting Zip archive...' >&2
unzip -q -d "$tmpdir" "$data_zip_archive"

echo 'Loading files into database...' >&2
echo '.mode tabs' >"$tmpdir/import.sql"

cat <<-'SQL' >>"$tmpdir/import.sql"
	PRAGMA temp_store = MEMORY;
	CREATE TEMPORARY TABLE import_tmp (
		query TEXT NOT NULL,
		BLAST_hit_genome TEXT NOT NULL,
		Start_alignment_query INTEGER NOT NULL,
		End_alignment_query INTEGER NOT NULL,
		fident REAL NOT NULL,
		alnlen INTEGER NOT NULL,
		mismatch INTEGER NOT NULL,
		gapopen INTEGER NOT NULL,
		qstart INTEGER NOT NULL,
		qend INTEGER NOT NULL,
		qlen INTEGER NOT NULL,
		tstart INTEGER NOT NULL,
		tend INTEGER NOT NULL,
		tlen INTEGER NOT NULL,
		evalue REAL NOT NULL,
		bits INTEGER NOT NULL,
		prob INTEGER NOT NULL,
		lddt REAL NOT NULL,
		alntmscore REAL NOT NULL,
		rmsd REAL NOT NULL,

		UNIQUE(BLAST_hit_genome),
		FOREIGN KEY(query) REFERENCES pdb(pdb_name)
	);
SQL

printf '.import --skip 1 %s import_tmp\n' "$tmpdir"/*.tab >>"$tmpdir/import.sql"

cat <<-'SQL' >>"$tmpdir/import.sql"
	INSERT INTO predicted_unique_homologues (
                BLAST_hit_genome, pdb_id, Start_alignment_query,
                End_alignment_query, fident, alnlen, mismatch, gapopen,
                qstart, qend, qlen, tstart, tend, tlen, evalue, bits,
                prob, lddt, alntmscore, rmsd
	)
	SELECT BLAST_hit_genome, pdb_id, Start_alignment_query,
	       End_alignment_query, fident, alnlen, mismatch, gapopen,
	       qstart, qend, qlen, tstart, tend, tlen, evalue, bits,
	       prob, lddt, alntmscore, rmsd
	FROM import_tmp
	JOIN pdb ON import_tmp.query = pdb.pdb_name
SQL

sqlite3 "$database" <"$tmpdir/import.sql"

echo 'Done.' >&2
