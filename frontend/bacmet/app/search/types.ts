export type FieldValue<T=unknown> = {
  value: T;
  label: string;
  _meta?: Record<string, unknown>;
}

export type Field<T=unknown> = {
  label: string;
  name: string;
  value?: T;
  values: FieldValue<T>[];
  placeholder?: string;
}

export type MultiValueField<T=unknown> = Omit<Field<T>, "value"> & {
  value: T[];
}

export type SearchParams = {
  chemicalClasses: FieldValue<string>[];
  compounds: FieldValue<string>[];
  geneNames: FieldValue<string>[];
}

export type Compound = {
  compound_name: string;
  chemical_class: string;
  cas_number: string;
}

export type Validated = {
  gene_name: string;
  bacmet_id: string;
  code_for: string;
  family: string;
  organism: string;
  location: string;
  compounds: Compound[];
  description: string;
  length_aa: string;
  reference: string;
}

export type Predicted = {
  bacmet_id: string;
  blast_hit_genome: string;
  start_alignment_query: number;
  end_alignment_query: number;
  fident: number;
  alnlen: number;
  mismatch: number;
  gapopen: number;
  qstart: number;
  qend: number;
  qlen: number;
  tstart: number;
  tend: number;
  tlen: number;
  evalue: number;
  bits: number;
  prob: number;
  lddt: number;
  alntmscore: number;
  rmsd: number;
}

export type Meta = {
  totalRecords: number;
  totalPages: number;
  page: number;
  count: number;
}

export type Link = {
  href: string;
  rel: string;
}

export type Result<T> = {
  items: T[];
  _meta: Meta;
  _links: Link[];
}

export type ValidatedResult = {
  type: "validated"
} & Result<Validated>

export type PredictedResult = {
  type: "predicted"
} & Result<Predicted>

export type ErrorResult = {
  type: "error";
  error: string;
}
