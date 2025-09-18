from flask import (  # type: ignore
    request,
    url_for,
    jsonify,
    make_response,
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
    get_from_validated,
    get_from_compounds
)
from .sensitivity_distributions import (
    get_sensitivity_histogram,
    get_species,
    get_biocides,
)
from .types import (
    SearchResult,
    Link,
    Meta,
    ValidatedResult,
    PredictedResult,
    Compound,
    Item,
    Histogram,
    HistogramBucket
)
from .core import create_app
from flask_cors import cross_origin


logger = logging.getLogger(__name__)


app = create_app(
    secret_key=os.getenv("APP_SECRET_KEY", os.urandom(24).hex()),
    message_root=os.getenv("APP_MESSAGE_ROOT", "/home/bacmet")
)


def make_error(message: str, status: int = 404):
    return make_response(jsonify({"error": message}), status)


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


@app.route('/api/health-check')
@cross_origin()
def health_check():
    return jsonify({"status": "ok"}), 200


@app.route('/api/search/predicted')
@cross_origin()
def predicted_search():
    chemical_class = request.args.getlist("chemical_class")
    compound = request.args.getlist("compound")
    location = parsers.location(request.args.get("location"))
    protein_description = parsers.protein_description(
        request.args.get("protein_description")
    )
    gene_name = request.args.getlist("gene_name")
    bacmet_id = request.args.get("bacmet_id")
    page = max(0, int(request.args.get("page", "0")))
    page_size = 100

    items, total_count = find_in_predicted(
        chemical_class=chemical_class,
        compound=compound,
        location=location,
        protein_description=protein_description,
        gene_name=gene_name,
        bacmet_id=bacmet_id,
        pagination=(page, page_size)
    )

    last_page = math.ceil(total_count / page_size) - 1
    args = {
        key: values
        for key, values in request.args.lists()
    }
    search_result = SearchResult(
        _meta=Meta(
            totalRecords=total_count,
            totalPages=last_page + 1,
            page=page,
            count=len(items)
        ),
        items=[
            PredictedResult(
                bacmet_id=bacmet_id,
                blast_hit_genome=predicted.blast_hit_genome,
                start_alignment_query=predicted.start_alignment_query,
                end_alignment_query=predicted.end_alignment_query,
                fident=predicted.fident,
                alnlen=predicted.alnlen,
                mismatch=predicted.mismatch,
                gapopen=predicted.gapopen,
                qstart=predicted.qstart,
                qend=predicted.qend,
                qlen=predicted.qlen,
                tstart=predicted.tstart,
                tend=predicted.tend,
                tlen=predicted.tlen,
                evalue=predicted.evalue,
                bits=predicted.bits,
                prob=predicted.prob,
                lddt=predicted.lddt,
                alntmscore=predicted.alntmscore,
                rmsd=predicted.rmsd,
            )
            for (bacmet_id, predicted) in items
        ],
        _links=pagination_for("predicted_search", page, last_page, args)
    )

    return jsonify(dataclasses.asdict(search_result))


@app.route('/api/search/validated')
@cross_origin()
def validated_search():
    chemical_class = request.args.getlist("chemical_class")
    compound = request.args.getlist("compound")
    location = parsers.location(request.args.get("location"))
    protein_description = parsers.protein_description(
        request.args.get("protein_description")
    )
    peptide_sequence_length_range = parsers.peptide_sequence_length_range((
        request.args.get("peptide_sequence_length_min"),
        request.args.get("peptide_sequence_length_max")
    ))
    gene_name = request.args.getlist("gene_name")
    free_text = request.args.get("free_text")

    page = max(0, int(request.args.get("page", "0")))
    page_size = 100

    items, total_count = find_in_validated(
        chemical_class=chemical_class,
        compound=compound,
        location=location,
        protein_description=protein_description,
        peptide_sequence_length_range=peptide_sequence_length_range,
        gene_name=gene_name,
        free_text=free_text,
        pagination=(page, page_size)
    )

    last_page = math.ceil(total_count / page_size) - 1
    args = {
        key: values
        for key, values in request.args.lists()
    }
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
                    Compound(
                        compound_name=compound.compound_name,
                        chemical_class=compound.chemical_class,
                        cas_number=compound.cas_number
                    )
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


@app.route('/api/validated/<entry_id>')
@cross_origin()
def validated_entry(entry_id: str):
    item = get_from_validated(entry_id)
    if item is None:
        return make_error(f"No entry found for: {entry_id}")
    result = ValidatedResult(
        gene_name=item.gene_name,
        bacmet_id=item.bacmet_id,
        code_for=item.code_for,
        family=item.family,
        organism=item.organism,
        location=item.location,
        compounds=[
            Compound(
                compound_name=compound.compound_name,
                chemical_class=compound.chemical_class,
                cas_number=compound.cas_number
            )
            for compound in item.compounds
        ],
        description=item.description,
        length_aa=item.length_aa,
        reference=item.reference,
    )
    return jsonify(dataclasses.asdict(result))


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
            Compound(
                compound_name=compound_name,
                chemical_class=chemical_class,
                cas_number=cas_number
            )
            for (compound_name, chemical_class, cas_number) in compounds
        ]
    )
    return jsonify(dataclasses.asdict(result))


@app.route('/api/aggregated/gene_name')
@cross_origin()
def aggregated_gene_name():
    chemical_class = tuple(*request.args.getlist("chemical_class"))
    compound = tuple(*request.args.getlist("compound"))
    location = parsers.location(request.args.get("location"))
    protein_description = parsers.protein_description(
        request.args.get("protein_description")
    )
    gene_name = request.args.get("gene_name")
    gene_names = get_gene_names(
        chemical_class=chemical_class,
        compound=compound,
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


@app.route('/api/sensitivity_distributions/histogram')
@cross_origin()
def sensitivity_distributions_histogram():
    species = request.args.get("species")
    biocide = request.args.get("biocide")

    if species is None or biocide is None:
        return make_error("Missing parameter biocide or species.", 400)

    buckets = get_sensitivity_histogram(
        species=species,
        biocide=biocide
    )
    result = Histogram(
        params={
            "species": species,
            "biocide": biocide,
        },
        type="MIC",
        unit="µg/mL",
        buckets=[
            HistogramBucket(
                range=bucket_range,
                count=bucket_count
            )
            for (bucket_range, bucket_count) in buckets
        ]
    )
    return jsonify(dataclasses.asdict(result))


@app.route('/api/sensitivity_distributions/aggregated/<param>')
@cross_origin()
def sensitivity_distributions_aggregated(param: str):
    aggregators = {
        "biocide": lambda: get_biocides(request.args.get("species")),
        "species": lambda: get_species(request.args.get("biocide"))
    }
    if param not in aggregators:
        return make_error(f"Aggregate not available: {param}", 404)

    aggregated_values = aggregators[param]()
    result = SearchResult(
        _links=[
            Link(
                rel="self",
                href=url_for("sensitivity_distributions_aggregated", _external=True, **{"param": param})
            ),
        ],
        _meta=Meta(
            totalRecords=len(aggregated_values),
            totalPages=1,
            page=0,
            count=len(aggregated_values)
        ),
        items=[
            Item(
                label=value,
                value=value
            )
            for value in aggregated_values
        ]
    )
    return jsonify(dataclasses.asdict(result))


@app.route('/api/compound/<compound_name>')
@cross_origin()
def compound_entry(compound_name: str):
    compound = get_from_compounds(compound_name)
    if compound is None:
        return make_error(f"No entry found for: {compound_name}")
    from .types import Compound 
    compound_data = Compound(
        compound_name=compound.compound_name,
        chemical_class=compound.chemical_class,
        cas_number=compound.cas_number,
        description=compound.description
    )
    return jsonify(dataclasses.asdict(compound_data))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
