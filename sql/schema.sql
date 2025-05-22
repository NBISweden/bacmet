DROP TABLE IF EXISTS experimentally_validated_pdb_files;
CREATE TABLE experimentally_validated_pdb_files (
	id INTEGER PRIMARY KEY,
	pdb_id TEXT NOT NULL UNIQUE,
	data TEXT NOT NULL
);
