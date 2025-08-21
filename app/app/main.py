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
from flask_cors import cross_origin


logger = logging.getLogger(__name__)


app = create_app(
    secret_key=os.getenv("APP_SECRET_KEY", os.urandom(24).hex()),
    message_root=os.getenv("APP_MESSAGE_ROOT", "/home/bacmet")
)


def pagination_for(endpoint: str, page: int, last_page: int, args: dict, pages_to_list=5):
    page_list_start = max(1, page - int(pages_to_list / 2))
    page_range = (
        page_list_start,
        min(page_list_start + pages_to_list, last_page)
    )
    return [
        Link(
            rel="self",
            href=url_for(endpoint, _external=True, **{**args, "page": page})
        ),
        *([] if page - 1 < 0 else [
            Link(
                rel="prev",
                href=url_for(endpoint, _external=True, **{**args, "page": page - 1})
            )
        ]),
        *([] if page + 1 > last_page else [
            Link(
                rel="next",
                href=url_for(endpoint, _external=True, **{**args, "page": page + 1})
            )
        ]),
        Link(
            rel="first",
            href=url_for(endpoint, _external=True, **{**args, "page": 0})
        ),
        *[
            Link(
                rel=f"{i + 1}",
                href=url_for(endpoint, _external=True, **{**args, "page": i})
            )
            for i in range(*page_range)
        ],
        Link(
            rel="last",
            href=url_for(endpoint, _external=True, **{**args, "page": last_page})
        ),
    ]


@app.route('/api/search/predicted')
@cross_origin()
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
            totalPages=last_page + 1,
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
        _links=pagination_for("predicted_search", page, last_page, args)
    )

    return jsonify(dataclasses.asdict(search_result))


@app.route('/api/search/validated')
@cross_origin()
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
            totalPages=last_page + 1,
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
        _links=pagination_for("validated_search", page, last_page, args)
    )

    return jsonify(dataclasses.asdict(search_result))


@app.route('/api/aggregated/chemical_class')
@cross_origin()
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
@cross_origin()
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
@cross_origin()
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
