import dataclasses
from typing import Literal, Optional, Tuple, Any


ChemicalClassType = Literal["class", "compound"]


ChemicalClass = Tuple[ChemicalClassType, str]


DatabaseOption = Literal["validated", "predicted"]


LocationOption = Literal["chromosome", "plasmid"]


OpenRange = Tuple[int | None, int | None]


@dataclasses.dataclass
class Item:
    label: str
    value: str


@dataclasses.dataclass
class Link:
    href: str
    rel: str


@dataclasses.dataclass
class Meta:
    totalRecords: int
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


@dataclasses.dataclass
class ValidatedResult:
    gene_name: str
    bacmet_id: str
    code_for: str
    family: str
    organism: str
    location: str
    compounds: list[Compound]
    description: str
    length_aa: str
    reference: str


@dataclasses.dataclass
class PredictedResult:
    gene_name: str
    protein_accession_uniprot: str
    organism: str
    compounds: list[Compound]
