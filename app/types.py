import dataclasses
from typing import Optional


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
