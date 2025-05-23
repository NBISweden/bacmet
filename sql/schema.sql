DROP TABLE IF EXISTS experimentally_validated;
CREATE TABLE experimentally_validated (
	pdb_id TEXT PRIMARY KEY,
	data TEXT NOT NULL
);

DROP TABLE IF EXISTS predicted_unique_homologues;
CREATE TABLE predicted_unique_homologues (
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

	FOREIGN KEY(query) REFERENCES
		experimentally_validated(pdb_id)
);
