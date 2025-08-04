#!/bin/sh

set -u

# shellcheck disable=SC2153
database=$DATABASE

echo 'Importing sensitivity distributions.' >&2

if [ ! -f "$database" ]; then
	printf 'Database "%s" not found\n' "$database" >&2
	exit 1
fi

count=$(
	sqlite3 "$database" <<-'SQL'
		SELECT COUNT(*) FROM sensitivity_distributions;
	SQL
)

if [ "$count" -gt 0 ]; then
	echo 'Data is already loaded.' >&2
	exit 0	# not an error
fi

tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT INT TERM
echo 'Extracting Zip archive...' >&2
for file do
	unzip -q -d "$tmpdir" "$file"
done

# This data needs to be preprocessed:
# * Rename "strain" column to "Strain",
# * Rename "Incubation time ()" to "Incubation time (h)",
# * Remove duplicated records,
# * Move comments from the unnamed field "Unnamed: 13" to the "Comment" field,
# * Remove empty columns.
# shellcheck disable=SC1010,SC2016
mlr --csv \
	rename 'strain,Strain,Incubation time (),Incubation time (h)' then \
	uniq -a then \
	put 'is_empty($Comment) { $["Unnamed: 13"] = $Comment; $["Unnamed: 13"] = ""; }' then \
	remove-empty-columns \
	"$tmpdir"/*.csv >"$tmpdir/data.csv"

echo 'Loading data into database...' >&2

cat <<-'SQL' >"$tmpdir/import.sql"
	.mode csv
	PRAGMA temp_store = MEMORY;
	CREATE TEMPORARY TABLE import_tmp (
		species TEXT NOT NULL,
		strain TEXT,
		geographical_region TEXT,
		source TEXT,
		biocide TEXT NOT NULL,
		mic REAL NOT NULL,
		method TEXT NOT NULL,
		temperature TEXT NOT NULL,
		incubation_time TEXT NOT NULL,
		media TEXT NOT NULL,
		doi TEXT NOT NULL,
		comment TEXT
	);
SQL

printf '.import --skip 1 %s import_tmp\n' "$tmpdir/data.csv" >>"$tmpdir/import.sql"

cat <<-'SQL' >>"$tmpdir/import.sql"
	INSERT INTO sensitivity_distributions (
                species, strain, geographical_region, source, biocide,
                mic, method, temperature, incubation_time, media, doi,
                comment
	)
	SELECT 
		species, strain, geographical_region, source, biocide,
		mic, method, temperature, incubation_time, media, doi,
		comment
	FROM import_tmp;
SQL

sqlite3 "$database" <"$tmpdir/import.sql"

echo 'Done.' >&2
