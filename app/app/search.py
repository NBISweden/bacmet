from sqlalchemy import select
from sqlalchemy.sql import func, collate, case, literal
from sqlalchemy.orm import joinedload
import re
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
from functools import cache, reduce
import operator


CHEMICAL_CLASS_WEIGHT = 1000
COMPOUND_WEIGHT = 1000
PROTEIN_DESCRIPTION_WEIGHT = 1000
LOCATION_WEIGHT = 1000
PEPTIDE_SEQUENCE_LENGTH_WEIGHT = 1000
GENE_NAME_WEIGHT = 1000
ORGANISM_WEIGHT = 500
CAS_NUMBER_WEIGHT = 1000


def ilike_rank(label, query_str, target_field, weight):
    ratio = (func.length(literal(query_str)) / func.length(target_field))
    return case(
        (target_field.ilike(query_str), ratio * weight),
        else_=0
    ).label(label)


def sum_rank(label, query, weight):
    rank = func.sum(
        case(
            (query, weight),
            else_=0
        )
    ).label(label)
    return func.coalesce(rank, 0)


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
    ranks = []
    if chemical_class and len(chemical_class) > 0:
        chemical_class_query = Compounds.chemical_class.in_(chemical_class)
        chemical_class_rank = func.sum(
            case(
                (chemical_class_query, CHEMICAL_CLASS_WEIGHT),
                else_=0
            )
        ).label("chemical_class_rank")
        ranks.append(func.coalesce(chemical_class_rank, 0))
        stmt = stmt.filter(
            Validated.compounds.any(chemical_class_query)
        )
    if compound and len(compound) > 0:
        compound_query = Compounds.compound_name.in_(compound)
        compound_rank = func.sum(
            case(
                (compound_query, COMPOUND_WEIGHT),
                else_=0
            )
        ).label("compound_rank")
        ranks.append(func.coalesce(compound_rank, 0))
        stmt = stmt.filter(
            Validated.compounds.any(compound_query)
        )
    if protein_description:
        protein_query = f"%{protein_description}%"
        protein_description_rank = ilike_rank(
            "protein_description_rank",
            protein_query,
            Validated.description,
            PROTEIN_DESCRIPTION_WEIGHT
        )
        ranks.append(protein_description_rank)
        stmt = stmt.filter(
            Validated.description.ilike(protein_query)
        )
    if location:
        location_query = f"%{location}%"
        location_rank = ilike_rank(
            "location_rank",
            location_query,
            Validated.location,
            LOCATION_WEIGHT
        )
        ranks.append(location_rank)
        stmt = stmt.filter(
            Validated.location.ilike(location_query)
        )
    if peptide_sequence_length_range:
        min_length, max_length = peptide_sequence_length_range
        if min_length is not None:
            ps_min_query = Validated.length_aa > min_length
            ps_min_rank = case(
                (ps_min_query, PEPTIDE_SEQUENCE_LENGTH_WEIGHT),
                else_=0
            ).label("ps_min_rank")
            ranks.append(ps_min_rank)
            stmt = stmt.filter(ps_min_query)
        if max_length is not None:
            ps_max_query = Validated.length_aa < max_length
            ps_max_rank = case(
                (ps_max_query, PEPTIDE_SEQUENCE_LENGTH_WEIGHT),
                else_=0
            ).label("ps_max_rank")
            ranks.append(ps_max_rank)
            stmt = stmt.filter(ps_max_query)
    if gene_name:
        gene_name_query = Validated.gene_name.in_(gene_name)
        gene_name_rank = case(
            (gene_name_query, GENE_NAME_WEIGHT),
            else_=0
        ).label("gene_name_rank")
        ranks.append(gene_name_rank)
        stmt = stmt.filter(gene_name_query)
    if free_text:
        search_pattern = build_wildcard_pattern(free_text)
        free_gene_name_rank = ilike_rank(
            "free_gene_name",
            search_pattern,
            Validated.gene_name,
            GENE_NAME_WEIGHT
        )
        free_organism_rank = ilike_rank(
            "free_organism_rank",
            search_pattern,
            Validated.organism,
            ORGANISM_WEIGHT
        )
        chemical_class_query = func.trim(Compounds.chemical_class).ilike(search_pattern, escape='\\')
        chemical_class_ratio = (func.length(literal(search_pattern)) / func.length(Compounds.chemical_class))
        free_chemical_class_rank = sum_rank(
            "free_chemcial_class_rank",
            chemical_class_query,
            chemical_class_ratio * CHEMICAL_CLASS_WEIGHT
        )
        compound_name_query = func.trim(Compounds.compound_name).ilike(search_pattern, escape='\\')
        compound_name_ratio = (func.length(literal(search_pattern)) / func.length(Compounds.compound_name))
        free_compound_name_rank = sum_rank(
            "free_compound_name_rank",
            compound_name_query,
            compound_name_ratio * COMPOUND_WEIGHT
        )
        cas_number_query = func.trim(Compounds.cas_number).ilike(search_pattern, escape='\\')
        cas_number_ratio = (func.length(literal(search_pattern)) / func.length(Compounds.cas_number))
        free_cas_number_rank = sum_rank(
            "free_cas_number_rank",
            cas_number_query,
            cas_number_ratio * COMPOUND_WEIGHT
        )
        ranks.append(free_gene_name_rank)
        ranks.append(free_organism_rank)
        ranks.append(free_chemical_class_rank)
        ranks.append(free_compound_name_rank)
        ranks.append(free_cas_number_rank)
        stmt = stmt.filter(
            func.trim(Validated.gene_name).ilike(search_pattern, escape='\\') |
            func.trim(Validated.organism).ilike(search_pattern, escape='\\') |
            Validated.compounds.any(compound_name_query) |
            Validated.compounds.any(chemical_class_query) |
            Validated.compounds.any(cas_number_query)
        )
    total_rank = (
        reduce(operator.add, ranks).label("total_rank")
        if len(ranks)
        else Validated.validated_id
    )
    return stmt.group_by(Validated.validated_id).order_by(total_rank.desc())


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
        joinedload(Validated.compounds),
        joinedload(Validated.nucleotide_sequence),
        joinedload(Validated.protein_sequence),
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
        ).outerjoin(Validated.compounds),
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

def build_wildcard_pattern(free_text: str) -> str:
    pattern = re.sub(r"([%_])", r"\\\1", free_text)
    if '*' not in free_text:
        return f"%{pattern}%"
    pattern = re.sub(r"\*+", "%", pattern)
    return pattern
