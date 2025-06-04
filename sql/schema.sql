
DROP TABLE IF EXISTS validated;
CREATE TABLE validated (
	validated_id INTEGER NOT NULL,
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

	PRIMARY KEY(validated_id)
);

DROP TABLE IF EXISTS validated_pdb;
CREATE TABLE validated_pdb (
	validated_id INTEGER NOT NULL,
	pdb TEXT NOT NULL,

	FOREIGN KEY(validated_id) REFERENCES
		validated(validated_id)
);

DROP TABLE IF EXISTS predicted_unique_homologues;
CREATE TABLE predicted_unique_homologues (
	predicted_id INTEGER NOT NULL,
	validated_id INTEGER NOT NULL,
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

	PRIMARY KEY(predicted_id),
	FOREIGN KEY(validated_id) REFERENCES
		validated(validated_id)
);

DROP TABLE IF EXISTS predicted_groups;
CREATE TABLE predicted_groups (
	predicted_id NOT NULL,
	sequence TEXT NOT NULL,
	matching_id_list TEXT NOT NULL,

	FOREIGN KEY(predicted_id) REFERENCES
		predicted_unique_homologues(predicted_id)
);
