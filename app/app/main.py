from flask import (  # type: ignore
    request,
    url_for,
    jsonify
)
import os
import logging
import dataclasses
import math
from . import parsers
from .search import (
    find_in_validated,
    find_in_predicted,
    get_chemical_classes,
    get_compounds,
    get_gene_names,
)
from .types import (
    SearchResult,
    Link,
    Meta,
    ValidatedResult,
    PredictedResult,
    Compound,
    Item,
)
from .core import create_app


logger = logging.getLogger(__name__)


app = create_app(
    secret_key=os.getenv("APP_SECRET_KEY", os.urandom(24).hex()),
    message_root=os.getenv("APP_MESSAGE_ROOT", "/home/bacmet")
)


@app.route('/api/search/predicted')
def predicted_search():
    chemical_class = parsers.chemical_class(request.args.get("chemical_class"))
    location = parsers.location(request.args.get("location"), "predicted")
    protein_description = parsers.protein_description(
        request.args.get("protein_description")
    )
    gene_name = request.args.get("gene_name")
    page = max(0, int(request.args.get("page", "0")))
    page_size = 100

    items, total_count = find_in_predicted(
        chemical_class=chemical_class,
        location=location,
        protein_description=protein_description,
        gene_name=gene_name,
        pagination=(page, page_size)
    )

    last_page = math.ceil(total_count / page_size) - 1
    args = request.args.to_dict()
    search_result = SearchResult(
        _meta=Meta(
            totalRecords=total_count,
            page=page,
            count=len(items)
        ),
        items=[
            PredictedResult(
                gene_name=item.gene_name,
                protein_accession_uniprot=item.protein_accession_uniprot,
                organism=item.organism,
                compounds=[
                    Compound(compound_name=compound.compound_name)
                    for compound in item.compounds
                ],
            )
            for (item, _predicted) in items
        ],
        _links=[
            Link(
                rel="self",
                href=url_for("predicted_search", **{**args, "page": page})
            ),
            Link(
                rel="next",
                href=url_for("predicted_search", **{**args, "page": max(0, page - 1)})
            ),
            Link(
                rel="prev",
                href=url_for("predicted_search", **{**args, "page": min(last_page, page + 1)})
            ),
        ]
    )

    return jsonify(dataclasses.asdict(search_result))


@app.route('/api/search/validated')
def validated_search():
    chemical_class = parsers.chemical_class(request.args.get("chemical_class"))
    location = parsers.location(request.args.get("location"), "validated")
    protein_description = parsers.protein_description(
        request.args.get("protein_description")
    )
    peptide_sequence_length_range = parsers.peptide_sequence_length_range((
        request.args.get("peptide_sequence_length_min"),
        request.args.get("peptide_sequence_length_max")
    ))
    gene_name = request.args.get("gene_name")
    page = max(0, int(request.args.get("page", "0")))
    page_size = 100
    items, total_count = find_in_validated(
        chemical_class=chemical_class,
        location=location,
        protein_description=protein_description,
        peptide_sequence_length_range=peptide_sequence_length_range,
        gene_name=gene_name,
        pagination=(page, page_size)
    )

    last_page = math.ceil(total_count / page_size) - 1
    args = request.args.to_dict()
    search_result = SearchResult(
        _meta=Meta(
            totalRecords=total_count,
            page=page,
            count=len(items)
        ),
        items=[
            ValidatedResult(
                gene_name=item.gene_name,
                bacmet_id=item.bacmet_id,
                code_for=item.code_for,
                family=item.family,
                organism=item.organism,
                location=item.location,
                compounds=[
                    Compound(compound_name=compound.compound_name)
                    for compound in item.compounds
                ],
                description=item.description,
                length_aa=item.length_aa,
                reference=item.reference,
            )
            for (item,) in items
        ],
        _links=[
            Link(
                rel="self",
                href=url_for("validated_search", **{**args, "page": page})
            ),
            Link(
                rel="next",
                href=url_for("validated_search", **{**args, "page": max(0, page - 1)})
            ),
            Link(
                rel="prev",
                href=url_for("validated_search", **{**args, "page": min(last_page, page + 1)})
            ),
        ]
    )

    return jsonify(dataclasses.asdict(search_result))


@app.route('/api/aggregated/chemical_class')
def aggregated_chemical_class():
    chemical_classes = get_chemical_classes()

    result = SearchResult(
        items=[
            Item(
                label=label,
                value=value
            )
            for (label, value) in chemical_classes
        ]
    )
    return jsonify(dataclasses.asdict(result))


@app.route('/api/aggregated/compound')
def aggregated_compound():
    compounds = get_compounds()

    result = SearchResult(
        items=[
            Item(
                label=label,
                value=value
            )
            for (label, value) in compounds
        ]
    )
    return jsonify(dataclasses.asdict(result))


@app.route('/api/aggregated/gene_name')
def aggregated_gene_name():
    chemical_class = parsers.chemical_class(request.args.get("chemical_class"))
    location = parsers.location(request.args.get("location"), "validated")
    protein_description = parsers.protein_description(
        request.args.get("protein_description")
    )
    gene_name = request.args.get("gene_name")
    gene_names = get_gene_names(
        chemical_class=chemical_class,
        location=location,
        protein_description=protein_description,
        gene_name=gene_name,
    )

    result = SearchResult(
        items=[
            Item(
                label=value,
                value=value
            )
            for value in gene_names
        ]
    )
    return jsonify(dataclasses.asdict(result))


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
