"""
Migrate Bettercoal data into Veris database.

Bettercoal dump uses integer PKs, We'll load the dump into a
separate temporary PostgreSQL database, then copy data over with
transformations to match Veris schema (UUID PKs).
"""

import os
import subprocess
import uuid

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

import psycopg2
from django.contrib.auth import get_user_model
from django.db import connection
from django.utils import timezone

User = get_user_model()


def connect_bettercoal_db():
    """Connect to the bettercoal temporary database on the same PG instance."""
    return psycopg2.connect(
        host="db",
        database="bettercoal",
        user="postgres",
        password="postgres_password",
    )


def ensure_temp_db():
    """
    Load bettercoal.dump into a 'bettercoal' temp database on the same
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
            "DROP DATABASE IF EXISTS bettercoal;",
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
            "CREATE DATABASE bettercoal;",
        ],
        check=True,
        capture_output=True,
    )
    # Load the dump
    dump_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "bettercoal.dump"
    )
    if not os.path.exists(dump_path):
        print(f"Cannot find bettercoal.dump at {dump_path}")
        return False

    result = subprocess.run(
        ["pg_restore", "-U", "postgres", "-h", "db", "-d", "bettercoal", dump_path],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(f"pg_restore failed: {result.stderr}")
        return False

    print("Loaded bettercoal.dump into temp database")
    return True