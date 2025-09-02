from .database import (
    db_session,
    SensitivityDistributions
)
from sqlalchemy import case, func, select, tuple_
from functools import cache


bucket_edges = [0, 0.002, 0.004, 0.008, 0.016, 0.032, 0.064, 0.125, 0.25, 0.5, 1, 2, 4, 8, 16, 32, 64, 125, 250, 500, 1000, None]
bucket_tuples = {
    f"{start}-{stop}": (start, stop)
    for start, stop in zip(bucket_edges, bucket_edges[1:])
}


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
                else ((SensitivityDistributions.mic >= start) & (SensitivityDistributions.mic < stop), key)
            )
            for key, (start, stop) in bucket_tuples.items()
        )
    )
    histogram_stmt = (
        select(buckets.label("bucket"), func.count().label("count"))
        .filter(func.lower(SensitivityDistributions.species) == species.lower())
        .filter(func.lower(SensitivityDistributions.biocide) == biocide.lower())
        .group_by(buckets)
        .order_by("bucket")
    )
    with db_session() as session:
        return [
            (bucket_tuples[key], count)
            for (key, count) in session.execute(histogram_stmt).all()
        ]
