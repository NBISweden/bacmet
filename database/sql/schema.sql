DROP TABLE IF EXISTS compounds;
CREATE TABLE compounds (
	compound_id INTEGER NOT NULL,
	compound_name TEXT NOT NULL,
	cas_number TEXT NOT NULL,
	chemical_class TEXT NOT NULL,
	description TEXT NOT NULL,

	PRIMARY KEY(compound_id),
	UNIQUE(compound_name)
);
CREATE INDEX chemical_class_idx ON compounds(chemical_class);

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
	description TEXT NOT NULL,
	length_aa INTEGER NOT NULL,
	reference TEXT NOT NULL,

	PRIMARY KEY(validated_id)
);

DROP TABLE IF EXISTS validated_compounds;
CREATE TABLE validated_compounds (
	validated_compound_id INTEGER NOT NULL,
	validated_id INTEGER NOT NULL,
	compound_id INTEGER NOT NULL,

	PRIMARY KEY(validated_compound_id),
	UNIQUE(compound_id, validated_id),
	FOREIGN KEY(validated_id) REFERENCES
		validated(validated_id),
	FOREIGN KEY(compound_id) REFERENCES
		compounds(compound_id)
);

DROP TABLE IF EXISTS validated_pdb;
CREATE TABLE validated_pdb (
	validated_id INTEGER NOT NULL,
	pdb TEXT NOT NULL,

	PRIMARY KEY(validated_id),
	FOREIGN KEY(validated_id) REFERENCES
		validated(validated_id)
);

DROP TABLE IF EXISTS predicted_unique_homologues;
CREATE TABLE predicted_unique_homologues (
	predicted_unique_homologue_id INTEGER NOT NULL,
	validated_id INTEGER NOT NULL,
	blast_hit_genome TEXT NOT NULL,
	start_alignment_query INTEGER NOT NULL,
	end_alignment_query INTEGER NOT NULL,
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

	PRIMARY KEY(predicted_unique_homologue_id),
	FOREIGN KEY(validated_id) REFERENCES
		validated(validated_id)
);
CREATE INDEX validated_idx ON predicted_unique_homologues(validated_id);

DROP TABLE IF EXISTS sequences;
CREATE TABLE sequences (
	sequence_id INTEGER NOT NULL,
	sequence TEXT NOT NULL,

	PRIMARY KEY(sequence_id)
);

DROP TABLE IF EXISTS predicted_groups;
CREATE TABLE predicted_groups (
	predicted_group_id INTEGER NOT NULL,
	predicted_unique_homologue_id INTEGER NOT NULL,
	sequence_id INTEGER NOT NULL,
	matching_ids TEXT NOT NULL,

	PRIMARY KEY(predicted_group_id),
	FOREIGN KEY(predicted_unique_homologue_id) REFERENCES
		predicted_unique_homologues(predicted_unique_homologue_id),
	FOREIGN KEY(sequence_id) REFERENCES
		sequences(sequence_id)
);

-- Note: Not directly related to the other tables.
DROP TABLE IF EXISTS sensitivity_distributions;
CREATE TABLE sensitivity_distributions (
	sensitivity_distribution_id INTEGER NOT NULL,
	species TEXT NOT NULL,
	strain TEXT NOT NULL,
	geographical_region TEXT NOT NULL,
	source TEXT NOT NULL,
	biocide TEXT NOT NULL,
	mic REAL NOT NULL,
	method TEXT NOT NULL,
	temperature TEXT NOT NULL,
	incubation_time TEXT NOT NULL,
	media TEXT NOT NULL,
	doi TEXT NOT NULL,
	comment TEXT,

	PRIMARY KEY(sensitivity_distribution_id)
);
