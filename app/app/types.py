import dataclasses
from typing import Literal, Optional, Tuple, Any


@dataclasses.dataclass
class FormFieldValue:
    value: str
    label: str


@dataclasses.dataclass
class FormField:
    name: str
    label: str
    value: str
    placeholder: Optional[str] = None
    values: Optional[list[FormFieldValue]] = None


ChemicalClassType = Literal["class", "compound"]


ChemicalClass = Tuple[ChemicalClassType, str]


DatabaseOption = Literal["validated", "predicted"]


LocationOption = Literal["chromosome", "plasmid"]


OpenRange = Tuple[int | None, int | None]


@dataclasses.dataclass
class MenuItem:
    href: str
    label: str


@dataclasses.dataclass
class ResultPage:
    state: Optional[Literal["active", "disabled"]] = None
    label: Optional[str] = None
    url: Optional[str] = None


@dataclasses.dataclass
class SearchResult:
    status: Optional[str] = None
    items: Optional[Any] = None
    pages: Optional[list[ResultPage]] = None
