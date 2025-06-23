from flask import (  # type: ignore
    Flask,
    render_template,
    request,
    url_for,
)
import os
import logging
import dataclasses
from .database import db_session, Validated
from . import parsers
from .search import (
    find_in_validated,
    find_in_predicted,
    get_chemical_classes,
    get_compounds
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
            ("Home", "#"),
            ("Browse", "#"),
            ("Search", "search"),
            ("BLAST", "#"),
            ("Download", "#"),
            ("About BacMet", "#"),
            ("Submission", "#"),
            ("Tutorial", "#"),
            ("FAQs", "#"),
            ("Contact", "#"),
        ]
    ]


@app.route('/')
def root():
    with db_session() as session:
        item = session.query(Validated).first()
        print("Hello world")
        print(item.validated_id, item.bacmet_id)
        print(session)
        print("ja")

    return render_template(
        'base.html',
        copyright="Developed by NBIS",
        brand_name="BacMet",
        navigation=get_navigation()
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
    page = int(request.args.get("page", "0"))
    page_size = min(100, int(request.args.get("page_size", "25")))
    items, total_count = (
        find_in_validated(
            chemical_class=chemical_class,
            location=location,
            protein_description=protein_description,
            peptide_sequence_length_range=peptide_sequence_length_range,
            pagination=(page, page_size)
        ) if database == "validated"
        else find_in_predicted(
            chemical_class=chemical_class,
            location=location,
            protein_description=protein_description,
            pagination=(page, page_size)
        )
    ) if database else (None, -1)
    chemical_classes = get_chemical_classes()
    compounds = get_compounds()

    pages_to_list = 5
    page_list_start = max(1, page - int(pages_to_list / 2))
    last_page = int(total_count / page_size)
    args = request.args.to_dict()
    search_result = (
        None if items is None
        else SearchResult(
            status=(
                f"Showing {len(items)} of {total_count} items."
                if len(items) > 0
                else "No results found."
            ),
            items=[
                item[0]
                for item in items
            ],
            pages=[
                ResultPage(
                    label=f"First",
                    state="active" if page == 0 else None,
                    url=url_for("advanced_search", **{**args, "page": 0})
                ),
                *[
                    ResultPage(
                        label=f"{i + 1}",
                        state="active" if page == i else None,
                        url=url_for("advanced_search", **{**args, "page": i})
                    )
                    for i in range(page_list_start, min(page_list_start + pages_to_list, last_page))
                ],
                ResultPage(
                    label=f"Last",
                    state="active" if page == last_page else None,
                    url=url_for("advanced_search", **{**args, "page": last_page})
                )
            ],
        )
    )

    fields = [
        FormField(
            name="database",
            label="Select database",
            value="validated" if database is None else database,
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
            value=chemical_class,
            values=[
                FormFieldValue(value="", label="class: Any"),
                *[
                    FormFieldValue(value=v, label=v)
                    for v in [
                        *chemical_classes,
                        *compounds
                    ]
                ]
            ]
        ),
        FormField(
            name="location",
            label="Select location",
            value="any" if location is None else location,
            values=[
                FormFieldValue(value="any", label="Any"),
                FormFieldValue(value="chromosome", label="Chromosome"),
                FormFieldValue(
                    value="plasmid",
                    label="Plasmid (for EXP confirmed database only)"
                ),
            ]
        ),
        FormField(
            name="protein_description",
            label="Protein description contains text",
            value="" if protein_description is None else protein_description,
        ),
        FormField(
            name="peptide_sequence_length_min",
            label=(
                "Peptide sequence length greater than "
                "(for EXP confirmed database only)"
            ),
            value=peptide_sequence_length_range[0],
            placeholder=50,
        ),
        FormField(
            name="peptide_sequence_length_max",
            label=(
                "Peptide sequence length less than "
                "(for EXP confirmed database only)"
            ),
            value=peptide_sequence_length_range[1],
            placeholder=2000
        ),
    ]
    return render_template(
        'search_result.html',
        copyright="Developed by NBIS",
        brand_name="BacMet",
        result=search_result,
        fields={
            field.name: field
            for field in fields
        },
        form_target="search",
        navigation=get_navigation()
    )


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
