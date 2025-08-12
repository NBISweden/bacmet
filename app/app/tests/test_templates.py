import os
import tempfile
import contextlib
import math
from html5validator import validator
from flask import (
    render_template,
)
from ..core import create_app
from ..types import FormField, SearchResult, ResultPage


html5validator = validator.Validator()


app = create_app(
    secret_key=os.urandom(24).hex(),
    message_root="",
)


@contextlib.contextmanager
def html_output_directory_test():
    with app.app_context():
        with tempfile.TemporaryDirectory(prefix="html-test") as workdir:
            def _add_test_data(name: str, data: str):
                with open(os.path.join(workdir, f"{name}.html"), "w") as f:
                    f.write(data)
            yield _add_test_data
            number_of_errors = html5validator.validate(
                validator.all_files(workdir)
            )
            if number_of_errors > 0:
                raise RuntimeError("HTML was not valid")


def test_search_result():
    items = [
        ({}, None),
        ({}, None),
        ({}, None),
        ({}, None),
    ]
    total_count = 200
    page_size = 10
    page = 0
    pages_to_list = 5
    page_list_start = max(1, page - int(pages_to_list / 2))
    last_page = math.ceil(total_count / page_size) - 1
    search_result = SearchResult(
        status="No results found.",
        items=items,
        pages=[
            ResultPage(
                label="First",
                state="active" if page == 0 else None,
                url=""
            ),
            *[
                ResultPage(
                    label=f"{i + 1}",
                    state="active" if page == i else None,
                    url=""
                )
                for i in range(
                    page_list_start,
                    min(page_list_start + pages_to_list, last_page)
                )
            ],
            ResultPage(
                label="Last",
                state="active" if page == last_page else None,
                url=""
            )
        ] if last_page > 0 else None,
    )
    fields = [
        FormField(
            name="database",
            label="Select database",
            value="validated",
            values=[]
        ),
        FormField(
            name="chemical_class",
            label="Select 'chemical class' / 'compound' (resistant to)",
            value="",
            values=[]
        ),
        FormField(
            name="location",
            label="Select location",
            value="any",
            values=[]
        ),
        FormField(
            name="protein_description",
            label="Protein description contains text",
            value="",
        ),
        FormField(
            name="peptide_sequence_length_min",
            label=(
                "Peptide sequence length greater than"
            ),
            value="",
            placeholder=50,
        ),
        FormField(
            name="peptide_sequence_length_max",
            label=(
                "Peptide sequence length less than"
            ),
            value="",
            placeholder=2000
        ),
    ]
    with html_output_directory_test() as add_test_data:
        result = render_template(
            "search_result.html",
            result=search_result,
            fields={
                field.name: field
                for field in fields
            },
            form_target="search",
            navigation=[],
        )
        add_test_data("search_result", result)
