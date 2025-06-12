from flask import (
    Flask,
    render_template,
)
import os
import logging
from .database import db_session, Validated


logger = logging.getLogger(__name__)


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


def get_navigation():
    return [
        {"href": "#", "label": "Hello world"},
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
        title="BacMet",
        navigation=get_navigation()
    )


@app.route('/validated/<bacmet_id>')
def deferred_result(bacmet_id: str):
    with db_session() as session:
        validated = session.query(Validated).filter(
            Validated.bacmet_id == bacmet_id
        ).first()

        return render_template(
            'base.html',
            copyright="Developed by NBIS",
            title="BacMet",
            content_text=(
                f"{validated.bacmet_id}({validated.validated_id}): {validated.gene_name}"
            ),
            navigation=get_navigation()
        )


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
