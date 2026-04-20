"""
Load a legacy framework dump into a temporary database before migrating it into Veris.

Legacy dumps often use integer primary keys, so this script restores the dump into a
separate temporary PostgreSQL database and then copies data over with transformations
to match the Veris schema (UUID PKs).
"""

import os
import subprocess

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

import psycopg2  # noqa: E402
from django.contrib.auth import get_user_model  # noqa: E402

User = get_user_model()


def connect_framework_import_db():
    """Connect to the framework_import temporary database on the same PG instance."""
    return psycopg2.connect(
        host="db",
        database="framework_import",
        user="postgres",
        password=os.environ.get("POSTGRES_PASSWORD", ""),
    )


def ensure_temp_db():
    """
    Load a framework dump into the 'framework_import' temp database on the same
    PG server as Veris (docker compose db service).
    """
    # Drop existing temp DB if it exists
    subprocess.run(
        [
            "psql",
            "-U",
            "postgres",
            "-h",
            "db",
            "-c",
            "DROP DATABASE IF EXISTS framework_import;",
        ],
        check=False,
        capture_output=True,
    )
    subprocess.run(
        [
            "psql",
            "-U",
            "postgres",
            "-h",
            "db",
            "-c",
            "CREATE DATABASE framework_import;",
        ],
        check=True,
        capture_output=True,
    )
    # Load the dump
    dump_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "framework.dump"
    )
    if not os.path.exists(dump_path):
        print(f"Cannot find framework dump at {dump_path}")
        return False

    result = subprocess.run(
        [
            "pg_restore",
            "-U",
            "postgres",
            "-h",
            "db",
            "-d",
            "framework_import",
            dump_path,
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(f"pg_restore failed: {result.stderr}")
        return False

    print("Loaded framework dump into temp database")
    return True
