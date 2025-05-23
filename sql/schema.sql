DROP TABLE IF EXISTS experimentally_validated;
CREATE TABLE experimentally_validated (
	pdb_id TEXT PRIMARY KEY,
	data TEXT NOT NULL
);
