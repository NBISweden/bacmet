from typing import cast, Literal, Optional, Tuple


def database(data: str) -> Optional[Literal["validated", "predicted"]]:
    value = None if data is None else data.lower()
    if value in {None, "validated", "predicted"}:
        return cast(Literal["validated", "predicted"], value)

    raise ValueError(f"Could not parse location: {value}")


def chemical_class(data: str) -> Optional[str]:
    return data


def location(
    data: str,
    database: Literal["validated", "predicted"]
) -> Optional[Literal["any", "chromosome"]]:
    value = None if data is None else data.lower()
    allowed_values = (
        {"any", "chromosome", "plasmid"}
        if database == "validated"
        else {"any", "chromosome"}
    )
    if value is None or value in allowed_values:
        return None if value == "any" else cast(
            Literal["any", "chromosome"], value
        )

    raise ValueError(
        f"Could not parse location: {value} for database: {database}"
    )


def protein_description(data: str) -> Optional[str]:
    return data


def peptide_sequence_length_range(
    data: Tuple[str, str]
) -> Optional[Tuple[int | None, int | None]]:
    min_len_str, max_len_str = data
    min_len = None if not min_len_str else int(min_len_str)
    max_len = None if not max_len_str else int(max_len_str)
    return min_len, max_len
