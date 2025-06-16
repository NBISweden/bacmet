from flask import (
    Flask,
    render_template,
    request,
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
from .types import FormField, FormFieldValue


logger = logging.getLogger(__name__)


@dataclasses.dataclass
class MenuItem:
    href: str
    label: str


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
    results = (
        find_in_validated(
            chemical_class=chemical_class,
            location=location,
            protein_description=protein_description,
            peptide_sequence_length_range=peptide_sequence_length_range
        ) if database == "validated"
        else find_in_predicted(
            chemical_class=chemical_class,
            location=location,
            protein_description=protein_description,
        )
    ) if database else None
    chemical_classes = get_chemical_classes()
    compounds = get_compounds()

    fields = [
        FormField(
            name="database",
            label="Select database",
            value=database,
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
            value=(
                50
                if peptide_sequence_length_range[0] is None
                else peptide_sequence_length_range[0]
            )
        ),
        FormField(
            name="peptide_sequence_length_max",
            label=(
                "Peptide sequence length less than "
                "(for EXP confirmed database only)"
            ),
            value=(
                2000
                if peptide_sequence_length_range[1] is None
                else peptide_sequence_length_range[1]
            )
        ),
    ]
    return render_template(
        'search_result.html',
        copyright="Developed by NBIS",
        brand_name="BacMet",
        results=results,
        fields={
            field.name: field
            for field in fields
        },
        form_target="search",
        navigation=get_navigation()
    )


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
