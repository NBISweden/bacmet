from flask import (
    Flask,
    render_template,
)
import os
import logging

logger = logging.getLogger(__name__)


def create_app(
    secret_key,
    message_root,
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


@app.route('/')
def root():
    return render_template(
        'base.html',
        copyright="Developed by NBIS",
        title="BacMet",
        navigation=[
            {"href": "#", "label": "Hello world"},
        ]
    )


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
