from flask import (  # type: ignore
    Flask,
)


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
