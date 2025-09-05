from .database import (
    db_session,
    SensitivityDistributions
)
from sqlalchemy import case, func, select
from functools import cache


bucket_edges = [
    0,
    0.002,
    0.004,
    0.008,
    0.016,
    0.032,
    0.064,
    0.125,
    0.25,
    0.5,
    1,
    2,
    4,
    8,
    16,
    32,
    64,
    125,
    250,
    500,
    1000,
    None
]
bucket_tuples = {
    f"{start}-{stop}": (start, stop)
    for start, stop in zip(bucket_edges, bucket_edges[1:])
}


@cache
def get_unique_values(value_column, row_filter=None):
    stmt = select(value_column)
    stmt = stmt if row_filter is None else stmt.filter(row_filter)

    with db_session() as session:
        items = session.execute(stmt.distinct())
        return [
            item[0]
            for item in items
        ]


def get_biocides(species: str | None = None):
    return get_unique_values(
        SensitivityDistributions.biocide,
        None if species is None else func.lower(SensitivityDistributions.species) == species.lower()
    )


def get_species(biocide: str | None = None):
    return get_unique_values(
        SensitivityDistributions.species,
        None if biocide is None else func.lower(SensitivityDistributions.biocide) == biocide.lower()
    )


@cache
def get_sensitivity_histogram(
    species: str,
    biocide: str,
):
    buckets = case(
        *(
            (
                (SensitivityDistributions.mic >= start, key)
                if stop is None
                else (
                    (SensitivityDistributions.mic >= start) &
                    (SensitivityDistributions.mic < stop),
                    key
                )
            )
            for key, (start, stop) in bucket_tuples.items()
        )
    )
    histogram_stmt = (
        select(buckets.label("bucket"), func.count().label("count"))
        .filter(
            (func.lower(SensitivityDistributions.species) == species.lower()) &
            (func.lower(SensitivityDistributions.biocide) == biocide.lower())
        )
        .group_by(buckets)
        .order_by("bucket")
    )
    with db_session() as session:
        return [
            (bucket_tuples[key], count)
            for (key, count) in session.execute(histogram_stmt).all()
        ]
