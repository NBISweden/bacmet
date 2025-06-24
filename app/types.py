import dataclasses
from typing import Literal, Optional, Tuple


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
