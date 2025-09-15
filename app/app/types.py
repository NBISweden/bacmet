import dataclasses
from typing import Literal, Optional, Tuple, Any


DatabaseOption = Literal["validated", "predicted"]


LocationOption = Literal["chromosome", "plasmid"]


OpenRange = Tuple[int | None, int | None]


@dataclasses.dataclass
class Item:
    label: str
    value: str
    _meta: Optional[dict[str, str]] = None


@dataclasses.dataclass
class Link:
    href: str
    rel: str


@dataclasses.dataclass
class Meta:
    totalRecords: int
    totalPages: int
    page: int
    count: int


@dataclasses.dataclass
class SearchResult:
    items: Optional[Any] = None
    _meta: Optional[Meta] = None
    _links: Optional[list[Link]] = None


@dataclasses.dataclass
class Compound:
    compound_name: str
    chemical_class: str
    cas_number: str
    description: Optional[str] = None


@dataclasses.dataclass
class ValidatedResult:
    bacmet_id: str
    gene_name: str
    code_for: str
    family: str
    protein_accession_ncbi: str
    nucleotide_accession_ena_embl: str
    protein_accession_uniprot: str
    organism: str
    location: str
    compounds: list[Compound]
    description: str
    length_aa: str
    reference: str


@dataclasses.dataclass
class PredictedResult:
    bacmet_id: str
    blast_hit_genome: str
    start_alignment_query: int
    end_alignment_query: int
    fident: float
    alnlen: int
    mismatch: int
    gapopen: int
    qstart: int
    qend: int
    qlen: int
    tstart: int
    tend: int
    tlen: int
    evalue: float
    bits: int
    prob: int
    lddt: float
    alntmscore: float
    rmsd: float


@dataclasses.dataclass
class HistogramBucket:
    range: tuple[float, float]
    count: int


@dataclasses.dataclass
class Histogram:
    params: dict[str, str]
    type: str
    unit: str
    buckets: list[HistogramBucket]
