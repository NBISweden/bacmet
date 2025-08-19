export type FieldValue<T=unknown> = {
  value: T;
  label: string;
}

export type Field<T=unknown> = {
  label: string;
  name: string;
  value?: T;
  values: FieldValue<T>[];
  placeholder?: string;
}

export type SearchParams = {
  chemicalClasses: FieldValue<string>[];
  compounds: FieldValue<string>[];
}

export type Compound = {
  compound_name: string;
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
  gene_name: string;
  protein_accession_uniprot: string;
  organism: string;
  compounds: Compound[];
}

export type Meta = {
  totalRecords: number;
  page: number;
  count: number;
}

export type Link = {
  href: string;
  rel: string;
}

export type Result<T> = {
  items: T[];
  _meta: Meta[];
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
