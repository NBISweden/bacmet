#!/bin/sh

set -u

database=$DATABASE
data_zip_archive=$1

echo 'Importing predicted unique homologues...' >&2

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
	printf 'Database "%s" already contains data\n' "$database" >&2
	exit 0	# not an error
fi

tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT INT TERM
echo 'Extracting TAB files...' >&2
unzip -q -d "$tmpdir" "$data_zip_archive"

echo 'Loading TAB files into database...' >&2
echo '.mode tabs' >"$tmpdir"/insert.sql
for pdb in "$tmpdir"/*.tab
do
	printf '.import --skip 1 %s predicted_unique_homologues\n' "$pdb"
done >>"$tmpdir"/insert.sql

sqlite3 "$database" <"$tmpdir"/insert.sql

echo 'Done.' >&2
