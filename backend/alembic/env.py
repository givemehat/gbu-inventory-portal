import os
import sys
from logging.config import fileConfig

from sqlalchemy import pool, create_engine
from alembic import context

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db import Base, url as default_url
import app.models  # load all models

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def get_current_url() -> str:
    return os.getenv("DATABASE_URL", default_url)


def run_migrations_offline() -> None:
    db_url = get_current_url()
    context.configure(
        url=db_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    db_url = get_current_url()
    connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}
    eng = create_engine(db_url, connect_args=connect_args)
    with eng.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=True if db_url.startswith("sqlite") else False,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
