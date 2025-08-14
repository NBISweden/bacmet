from flask import (  # type: ignore
    Flask,
    render_template,
    request,
    url_for,
)
import os
import logging
import dataclasses
import math
from .database import db_session, Validated
from . import parsers
from .search import (
    find_in_validated,
    find_in_predicted,
    get_chemical_classes,
    get_compounds,
    get_additional_search_params
)
from typing import Any, Optional, Literal
from .types import FormField, FormFieldValue


logger = logging.getLogger(__name__)


@dataclasses.dataclass
class MenuItem:
    href: str
    label: str


@dataclasses.dataclass
class ResultPage:
    state: Optional[Literal["active", "disabled"]] = None
    label: Optional[str] = None
    url: Optional[str] = None


@dataclasses.dataclass
class SearchResult:
    status: Optional[str] = None
    items: Optional[Any] = None
    pages: Optional[list[ResultPage]] = None


def create_app(
    secret_key: str,
    message_root: str,
):
    app = Flask(
        __name__,
        static_folder="static"
    )
    app.secret_key = secret_key
    app.config["MESSAGE_ROOT"] = message_root
    return app


app = create_app(
    secret_key=os.getenv("APP_SECRET_KEY", os.urandom(24).hex()),
    message_root=os.getenv("APP_MESSAGE_ROOT", "/home/bacmet")
)


def get_navigation() -> list[MenuItem]:
    return [
        MenuItem(label=label, href=href)
        for label, href in [
            ("Browse & Search", "/search"),
            ("Advanced search", "#"),
            ("BLAST", "#"),
            ("Download", "#"),
            ("FAQ", "#"),
            ("About BacMet", "#"),
            ("Contact", "#"),
        ]
    ]


@app.context_processor
def inject_site_info():
    return {
        "site_info": {
            "copyright": "Copyright © 2013-2018 All rights reserved",
            "brand_name": "BacMet",
            "contact": "info@example.com",
            "attribution": (
                "BacMet database/website was developed and designed by Chandan"
                " Pal and currently maintained by Joakim Larsson's team"
            ),
        }
    }


@app.route('/')
def root():
    with db_session() as session:
        item = session.query(Validated).first()
        print("Hello world")
        print(item.validated_id, item.bacmet_id)
        print(session)
        print("ja")

    index_info = {
        "hero_text": "BacMet is an easy-to-use bioinformatics resource of antibacterial biocide- and metal-resistance genes.",
        "title": "BacMet Antibacterial Biocide & Metal Resistance Genes Database",
        "search_title": (
            "Quick search"
        ),
    }

    return render_template(
        'index.html',
        navigation=get_navigation(),
        index_info=index_info,
    )


def value_or_default(value, default):
    return (
        default
        if value is None
        else value
    )


@app.route('/search')
def advanced_search():
    database = parsers.database(request.args.get("database"))
    chemical_class = parsers.chemical_class(request.args.get("chemical_class"))
    location = parsers.location(request.args.get("location"), database)
    protein_description = parsers.protein_description(
        request.args.get("protein_description")
    )
    peptide_sequence_length_range = parsers.peptide_sequence_length_range((
        request.args.get("peptide_sequence_length_min"),
        request.args.get("peptide_sequence_length_max")
    ))
    gene_name = request.args.get("gene_name")
    page = int(request.args.get("page", "0"))
    page_size = min(100, int(request.args.get("page_size", "25")))
    items, total_count = (
        find_in_validated(
            chemical_class=chemical_class,
            location=location,
            protein_description=protein_description,
            peptide_sequence_length_range=peptide_sequence_length_range,
            gene_name=gene_name,
            pagination=(page, page_size)
        ) if database == "validated"
        else find_in_predicted(
            chemical_class=chemical_class,
            location=location,
            protein_description=protein_description,
            gene_name=gene_name,
            pagination=(page, page_size)
        )
    ) if database else (None, -1)
    chemical_classes = get_chemical_classes()
    compounds = get_compounds()

    pages_to_list = 5
    page_list_start = max(1, page - int(pages_to_list / 2))
    last_page = math.ceil(total_count / page_size) - 1
    args = request.args.to_dict()
    search_result = (
        None if items is None
        else SearchResult(
            status=(
                f"Showing {len(items)} of {total_count} items."
                f" On page {page + 1} of {last_page + 1}."
                if len(items) > 0
                else "No results found."
            ),
            items=items,
            pages=[
                ResultPage(
                    label="First",
                    state="active" if page == 0 else None,
                    url=url_for("advanced_search", **{**args, "page": 0})
                ),
                *[
                    ResultPage(
                        label=f"{i + 1}",
                        state="active" if page == i else None,
                        url=url_for("advanced_search", **{**args, "page": i})
                    )
                    for i in range(
                        page_list_start,
                        min(page_list_start + pages_to_list, last_page)
                    )
                ],
                ResultPage(
                    label="Last",
                    state="active" if page == last_page else None,
                    url=url_for(
                        "advanced_search",
                        **{**args, "page": last_page}
                    )
                )
            ] if last_page > 0 else None,
        )
    )

    additional_params = (
        []
        if items is None
        else get_additional_search_params(
            chemical_class=chemical_class,
            location=location,
            protein_description=protein_description,
            gene_name=gene_name,
        )
    )

    fields = [
        FormField(
            name="database",
            label="Select database",
            value=value_or_default(database, "validated"),
            values=[
                FormFieldValue(
                    value="validated",
                    label="Experimentally confirmed database"
                ),
                FormFieldValue(
                    value="predicted",
                    label="Predicted database"
                ),
            ]
        ),
        FormField(
            name="chemical_class",
            label="Select 'chemical class' / 'compound' (resistant to)",
            value=":".join(chemical_class) if chemical_class else "",
            values=[
                FormFieldValue(value="", label="class: Any"),
                *[
                    FormFieldValue(value=value, label=label)
                    for (label, value) in [
                        *chemical_classes,
                        *compounds
                    ]
                ]
            ]
        ),
        FormField(
            name="location",
            label="Select location",
            value=value_or_default(location, "any"),
            values=[
                FormFieldValue(value="any", label="Any"),
                FormFieldValue(value="chromosome", label="Chromosome"),
                FormFieldValue(
                    value="plasmid",
                    label="Plasmid"
                ),
            ]
        ),
        FormField(
            name="protein_description",
            label="Protein description contains text",
            value=value_or_default(protein_description, ""),
        ),
        FormField(
            name="peptide_sequence_length_min",
            label=(
                "Peptide sequence length greater than"
            ),
            value=value_or_default(peptide_sequence_length_range[0], ""),
            placeholder=50,
        ),
        FormField(
            name="peptide_sequence_length_max",
            label=(
                "Peptide sequence length less than"
            ),
            value=value_or_default(peptide_sequence_length_range[1], ""),
            placeholder=2000
        ),
        *additional_params
    ]
    return render_template(
        'search_result.html',
        result=search_result,
        fields={
            field.name: field
            for field in fields
        },
        form_target="search",
        navigation=get_navigation(),
    )


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
