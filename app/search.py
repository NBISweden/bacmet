from typing import Literal, Optional, Tuple
from .database import (
    db_session,
    Validated,
    Compounds
)


def find_in_validated(
    chemical_class: Optional[str],
    location: Literal["any", "chromosome", "plasmid"],
    protein_description: Optional[str],
    peptide_sequence_length_range: Optional[Tuple[int | None, int | None]],
) -> list[Validated]:
    with db_session() as session:
        items = session.query(Validated)
        if chemical_class:
            items = items.filter(
                Validated.compound.ilike(f"%{chemical_class}%")
            )
        if protein_description:
            items = items.filter(
                Validated.description.ilike(f"%{protein_description}%")
            )
        if peptide_sequence_length_range:
            min_length, max_length = peptide_sequence_length_range
            if min_length is not None:
                items = items.filter(
                    Validated.length_aa > min_length
                )
            if max_length is not None:
                items = items.filter(
                    Validated.length_aa < max_length
                )
        return list(items)


def find_in_predicted(
    chemical_class: Optional[str],
    location: Literal["any", "chromosome"],
    protein_description: Optional[str],
):
    return []


def get_chemical_classes():
    with db_session() as session:
        chemical_classes = session.query(Compounds.chemical_class).distinct()
        return [
            f"class: {cc}"
            for cc, in chemical_classes
        ]


def get_compounds():
    with db_session() as session:
        compound_names = session.query(Compounds.compound_name).distinct()
        return [
            cn
            for cn, in compound_names
        ]
