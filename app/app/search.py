from sqlalchemy import select
from sqlalchemy.sql import func, collate
from sqlalchemy.orm import joinedload
from typing import Optional, Tuple
from .database import (
    db_session,
    Validated,
    PredictedUniqueHomologues,
    PredictedGroups,
    Compounds,
    ValidatedCompounds
)
from .types import (
    LocationOption,
    OpenRange,
)
from functools import cache


def apply_search_filters(
    stmt,
    chemical_class: Optional[list[str]],
    compound: Optional[list[str]],
    location: Optional[LocationOption],
    protein_description: Optional[str],
    peptide_sequence_length_range: Optional[OpenRange],
    gene_name: Optional[list[str]] = None,
    free_text: Optional[str] = None
):
    if chemical_class and len(chemical_class) > 0:
        stmt = stmt.filter(
            Validated.compounds.any(
                Compounds.chemical_class.in_(chemical_class)
            )
        )
    if compound and len(compound) > 0:
        stmt = stmt.filter(
            Validated.compounds.any(
                Compounds.compound_name.in_(compound)
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
    if gene_name:
        stmt = stmt.filter(
            Validated.gene_name.in_(gene_name)
        )
    if free_text:
        search_pattern = f"%{free_text}%"
        stmt = stmt.filter(
            (Validated.gene_name.ilike(search_pattern)) |
            (Validated.compounds.any(Compounds.compound_name.ilike(search_pattern))) |
            (Validated.compounds.any(Compounds.chemical_class.ilike(search_pattern)))
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


def get_from_validated(
    bacmet_id: str
) -> Validated:
    stmt = select(Validated).options(
        joinedload(Validated.compounds)
    ).order_by(Validated.validated_id).filter(Validated.bacmet_id == bacmet_id)
    with db_session() as session:
        return session.execute(stmt).unique().scalar_one_or_none()


def get_from_predicted(
    blast_hit_genome: str
) -> PredictedUniqueHomologues:
    stmt = select(PredictedUniqueHomologues).options(
        joinedload(PredictedUniqueHomologues.group),
        joinedload(PredictedUniqueHomologues.validated),
        joinedload(PredictedUniqueHomologues.group, PredictedGroups.sequence),
    ).order_by(PredictedUniqueHomologues.predicted_unique_homologue_id).filter(PredictedUniqueHomologues.blast_hit_genome == blast_hit_genome)
    with db_session() as session:
        return session.execute(stmt).scalar_one_or_none()

def get_from_compounds(
    compound_name
) -> Compounds:
    stmt = select(Compounds).where(Compounds.compound_name == compound_name)
    with db_session() as session:
        result = session.execute(stmt).first()
        if result:
            (compound,) = result
            return compound
        return None

def find_in_validated(
    chemical_class: Optional[list[str]],
    compound: Optional[list[str]],
    location: Optional[LocationOption],
    protein_description: Optional[str],
    peptide_sequence_length_range: Optional[OpenRange],
    gene_name: Optional[list[str]],
    pagination: Tuple[int, int],
    free_text: Optional[str] = None
) -> Tuple[list[Validated], int]:
    stmt = apply_search_filters(
        select(Validated).options(
            joinedload(Validated.compounds)
        ).order_by(Validated.validated_id),
        chemical_class,
        compound,
        location,
        protein_description,
        peptide_sequence_length_range,
        gene_name,
        free_text
    )
    with db_session() as session:
        items = session.execute(
            apply_pagination(stmt, pagination)
        ).unique().all()
        total_count = session.execute(apply_total_count(stmt)).scalar()
        return (list(items), total_count)


def find_in_predicted(
    chemical_class: Optional[list[str]],
    compound: Optional[list[str]],
    location: Optional[LocationOption],
    protein_description: Optional[str],
    gene_name: Optional[list[str]],
    bacmet_id: Optional[str],
    pagination: Tuple[int, int]
) -> Tuple[list[Tuple[Validated, PredictedUniqueHomologues]], int]:
    base_stmt = select(
        Validated.bacmet_id,
        PredictedUniqueHomologues,
    ).order_by(
        PredictedUniqueHomologues.predicted_unique_homologue_id
    ).join(
        Validated,
        PredictedUniqueHomologues.validated_id == Validated.validated_id
    )
    if bacmet_id:
        base_stmt = base_stmt.filter(Validated.bacmet_id == bacmet_id)
    stmt = apply_search_filters(
        base_stmt,
        chemical_class,
        compound,
        location,
        protein_description,
        (None, None),
        gene_name
    )
    with db_session() as session:
        items = session.execute(apply_pagination(stmt, pagination)).unique().all()
        total_count = session.execute(apply_total_count(stmt)).scalar()
        return (list(items), total_count)


@cache
def get_chemical_classes() -> list[Tuple[str, str]]:
    all_compounds = select(ValidatedCompounds.compound_id).distinct()
    stmt = select(Compounds.chemical_class).filter(Compounds.compound_id.in_(all_compounds)).distinct().order_by(collate(Compounds.chemical_class, 'NOCASE'))
    with db_session() as session:
        chemical_classes = session.execute(stmt)
        return [
            (f"class: {cc}", cc)
            for cc, in chemical_classes
        ]


@cache
def get_compounds() -> list[Tuple[str, str, str]]:
    all_compounds = select(ValidatedCompounds.compound_id).distinct()
    stmt = select(Compounds.compound_name, Compounds.chemical_class, Compounds.cas_number).filter(Compounds.compound_id.in_(all_compounds)).distinct().order_by(collate(Compounds.compound_name, 'NOCASE'))
    with db_session() as session:
        compound_info = session.execute(stmt)
        return [
            (cname, cclass, cnum)
            for cname, cclass, cnum in compound_info
        ]


@cache
def get_gene_names(
    chemical_class: Optional[list[str]],
    compound: Optional[list[str]],
    location: Optional[LocationOption],
    protein_description: Optional[str],
    gene_name: Optional[str]
):
    summary_stmt = apply_search_filters(
        select(Validated.gene_name).order_by(collate(Validated.gene_name, 'NOCASE')),
        chemical_class,
        compound,
        location,
        protein_description,
        (None, None)
    ).distinct()
    with db_session() as session:
        return [
            item[0]
            for item in list(session.execute(summary_stmt))
        ]
