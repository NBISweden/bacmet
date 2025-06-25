from sqlalchemy import select
from sqlalchemy.sql import func
from sqlalchemy.orm import joinedload
from typing import Optional, Tuple
from .database import (
    db_session,
    Validated,
    PredictedUniqueHomologues,
    Compounds
)
from .types import LocationOption, OpenRange, ChemicalClass


def apply_search_filters(
    stmt,
    chemical_class: Optional[ChemicalClass],
    location: Optional[LocationOption],
    protein_description: Optional[str],
    peptide_sequence_length_range: Optional[OpenRange],
):
    if chemical_class:
        chemical_class_type, chemical_class_name = chemical_class
        if chemical_class_type == "class":
            stmt = stmt.filter(
                Validated.compounds.any(
                    Compounds.chemical_class.ilike(f"%{chemical_class_name}%")
                )
            )
        elif chemical_class_type == "compound":
            stmt = stmt.filter(
                Validated.compounds.any(
                    Compounds.compound_name.ilike(f"%{chemical_class_name}%")
                )
            )
    if protein_description:
        stmt = stmt.filter(
            Validated.description.ilike(f"%{protein_description}%")
        )
    if location:
        stmt = stmt.filter(
            Validated.location.ilike(f"%{location}%")
        )
    if peptide_sequence_length_range:
        min_length, max_length = peptide_sequence_length_range
        if min_length is not None:
            stmt = stmt.filter(
                Validated.length_aa > min_length
            )
        if max_length is not None:
            stmt = stmt.filter(
                Validated.length_aa < max_length
            )
    return stmt


def apply_pagination(stmt, pagination: Tuple[int, int]):
    page, page_size = pagination
    return (
        stmt
        .limit(page_size)
        .offset(page * page_size)
    )


def apply_total_count(stmt):
    return select(func.count()).select_from(stmt.subquery())


def find_in_validated(
    chemical_class: Optional[ChemicalClass],
    location: Optional[LocationOption],
    protein_description: Optional[str],
    peptide_sequence_length_range: Optional[OpenRange],
    pagination: Tuple[int, int]
) -> Tuple[list[Validated], int]:
    stmt = apply_search_filters(
        select(Validated).options(
            joinedload(Validated.compounds)
        ).order_by(Validated.validated_id),
        chemical_class,
        location,
        protein_description,
        peptide_sequence_length_range
    )
    with db_session() as session:
        items = session.execute(
            apply_pagination(stmt, pagination)
        ).unique().all()
        total_count = session.execute(apply_total_count(stmt)).scalar()
        return (list(items), total_count)


def find_in_predicted(
    chemical_class: Optional[ChemicalClass],
    location: Optional[LocationOption],
    protein_description: Optional[str],
    pagination: Tuple[int, int]
) -> Tuple[list[Tuple[Validated, PredictedUniqueHomologues]], int]:
    stmt = apply_search_filters(
        select(
            Validated,
            PredictedUniqueHomologues,
        ).options(
            joinedload(Validated.compounds)
        ).order_by(
            PredictedUniqueHomologues.predicted_unique_homologue_id
        ).join(
            Validated,
            PredictedUniqueHomologues.validated_id == Validated.validated_id
        ),
        chemical_class,
        location,
        protein_description,
        (None, None)
    )
    with db_session() as session:
        items = session.execute(apply_pagination(stmt, pagination)).unique().all()
        total_count = session.execute(apply_total_count(stmt)).scalar()
        return (list(items), total_count)


def get_chemical_classes() -> list[Tuple[str, str]]:
    with db_session() as session:
        chemical_classes = session.query(Compounds.chemical_class).distinct()
        return [
            (f"class: {cc}", f"class:{cc.lower()}")
            for cc, in chemical_classes
        ]


def get_compounds() -> list[Tuple[str, str]]:
    with db_session() as session:
        compound_names = session.query(Compounds.compound_name).distinct()
        return [
            (cn, f"compound:{cn.lower()}")
            for cn, in compound_names
        ]
