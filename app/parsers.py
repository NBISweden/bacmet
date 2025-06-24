from typing import cast,  Optional, Tuple
from .types import DatabaseOption, ChemicalClassType, LocationOption, OpenRange


def database(data: str) -> Optional[DatabaseOption]:
    value = None if data is None else data.lower()
    if value in {None, "validated", "predicted"}:
        return cast(DatabaseOption, value)

    raise ValueError(f"Could not parse location: {value}")


def chemical_class(data: str) -> (
    Optional[Tuple[ChemicalClassType, str]]
):
    if data:
        [value_type_str, *value] = data.lower().split(":")
        if value_type_str in {"class", "compound"}:
            value_type = cast(ChemicalClassType, value_type_str)
            return value_type, ":".join(value)
    else:
        return None

    raise ValueError(f"Could not parse chemical_class: {value}")


def location(
    data: str,
    database: DatabaseOption
) -> Optional[LocationOption]:
    value = None if data is None else data.lower()
    allowed_values = (
        {"any", "chromosome", "plasmid"}
        if database == "validated"
        else {"any", "chromosome"}
    )
    if value is None or value in allowed_values:
        return None if value == "any" else cast(
           LocationOption, value
        )

    raise ValueError(
        f"Could not parse location: {value} for database: {database}"
    )


def protein_description(data: str) -> Optional[str]:
    return data


def peptide_sequence_length_range(
    data: Tuple[str, str]
) -> Optional[OpenRange]:
    min_len_str, max_len_str = data
    min_len = None if not min_len_str else int(min_len_str)
    max_len = None if not max_len_str else int(max_len_str)
    return min_len, max_len
