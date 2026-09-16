# ============================================================
# ASTRO BOT
# database.py
# SQLite database manager
# ============================================================

import os
import sqlite3
from pathlib import Path
from datetime import datetime


# ============================================================
# CONFIGURATION
# ============================================================

DATABASE_PATH = os.getenv(
    "DATABASE_PATH",
    "data/astro.db",
).strip()

DATABASE_FILE = Path(
    DATABASE_PATH
)

DATABASE_FILE.parent.mkdir(
    parents=True,
    exist_ok=True,
)


# ============================================================
# TIME
# ============================================================

def now_string():
    return datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    )


# ============================================================
# CONNECTION
# ============================================================

def get_connection():
    connection = sqlite3.connect(
        str(DATABASE_FILE),
        timeout=30,
        check_same_thread=False,
    )

    connection.row_factory = sqlite3.Row

    connection.execute(
        "PRAGMA journal_mode=WAL"
    )

    connection.execute(
        "PRAGMA foreign_keys=ON"
    )

    connection.execute(
        "PRAGMA busy_timeout=30000"
    )

    return connection


# ============================================================
# INITIALIZE DATABASE
# ============================================================

def init_database():

    connection = get_connection()

    try:

        cursor = connection.cursor()

        # ----------------------------------------------------
        # USERS
        # ----------------------------------------------------

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,

                telegram_id INTEGER NOT NULL UNIQUE,

                username TEXT,
                first_name TEXT,
                last_name TEXT,

                language TEXT,

                first_seen TEXT NOT NULL,
                last_seen TEXT NOT NULL,

                total_searches INTEGER NOT NULL DEFAULT 0
            )
            """
        )

        # ----------------------------------------------------
        # SEARCHES
        # ----------------------------------------------------

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS searches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,

                telegram_id INTEGER NOT NULL,

                search_name TEXT NOT NULL,

                birth_day INTEGER,
                birth_month INTEGER,
                birth_year INTEGER,

                birth_hour INTEGER,
                birth_minute INTEGER,
                birth_period TEXT,

                country TEXT,
                city TEXT,

                created_at TEXT NOT NULL,

                result_text TEXT,
                status TEXT NOT NULL DEFAULT 'pending',

                FOREIGN KEY (
                    telegram_id
                )
                REFERENCES users (
                    telegram_id
                )
                ON DELETE CASCADE
            )
            """
        )

        # ----------------------------------------------------
        # SEARCH LOGS
        # ----------------------------------------------------

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS search_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,

                search_id INTEGER,

                telegram_id INTEGER NOT NULL,

                event TEXT NOT NULL,

                details TEXT,

                created_at TEXT NOT NULL,

                FOREIGN KEY (
                    search_id
                )
                REFERENCES searches (
                    id
                )
                ON DELETE CASCADE
            )
            """
        )

        # ----------------------------------------------------
        # INDEXES
        # ----------------------------------------------------

        cursor.execute(
            """
            CREATE INDEX IF NOT EXISTS
            idx_users_telegram_id
            ON users (telegram_id)
            """
        )

        cursor.execute(
            """
            CREATE INDEX IF NOT EXISTS
            idx_searches_telegram_id
            ON searches (telegram_id)
            """
        )

        cursor.execute(
            """
            CREATE INDEX IF NOT EXISTS
            idx_searches_created_at
            ON searches (created_at)
            """
        )

        cursor.execute(
            """
            CREATE INDEX IF NOT EXISTS
            idx_search_logs_search_id
            ON search_logs (search_id)
            """
        )

        cursor.execute(
            """
            CREATE INDEX IF NOT EXISTS
            idx_search_logs_telegram_id
            ON search_logs (telegram_id)
            """
        )

        connection.commit()

    finally:

        connection.close()


# ============================================================
# USER MANAGEMENT
# ============================================================

def upsert_user(
    telegram_id,
    username=None,
    first_name=None,
    last_name=None,
    language_code=None,
):

    connection = get_connection()

    try:

        cursor = connection.cursor()

        current_time = now_string()

        cursor.execute(
            """
            INSERT INTO users (
                telegram_id,
                username,
                first_name,
                last_name,
                language,
                first_seen,
                last_seen,
                total_searches
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, 0)

            ON CONFLICT(telegram_id)
            DO UPDATE SET
                username = excluded.username,
                first_name = excluded.first_name,
                last_name = excluded.last_name,
                language = excluded.language,
                last_seen = excluded.last_seen
            """,
            (
                telegram_id,
                username,
                first_name,
                last_name,
                language_code,
                current_time,
                current_time,
            ),
        )

        connection.commit()

    finally:

        connection.close()


def get_user(
    telegram_id,
):

    connection = get_connection()

    try:

        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT *
            FROM users
            WHERE telegram_id = ?
            LIMIT 1
            """,
            (
                telegram_id,
            ),
        )

        row = cursor.fetchone()

        if row is None:
            return None

        return dict(row)

    finally:

        connection.close()


def get_all_users():

    connection = get_connection()

    try:

        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT *
            FROM users
            ORDER BY last_seen DESC
            """
        )

        rows = cursor.fetchall()

        return [
            dict(row)
            for row in rows
        ]

    finally:

        connection.close()


def count_users():

    connection = get_connection()

    try:

        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT COUNT(*)
            FROM users
            """
        )

        return cursor.fetchone()[0]

    finally:

        connection.close()


def increment_user_searches(
    telegram_id,
):

    connection = get_connection()

    try:

        cursor = connection.cursor()

        cursor.execute(
            """
            UPDATE users
            SET total_searches =
                total_searches + 1,
                last_seen = ?
            WHERE telegram_id = ?
            """,
            (
                now_string(),
                telegram_id,
            ),
        )

        connection.commit()

    finally:

        connection.close()


# ============================================================
# SEARCH MANAGEMENT
# ============================================================

def create_search(
    telegram_id,
    search_name,
    birth_year,
    birth_month,
    birth_day,
    birth_hour=None,
    birth_minute=None,
    birth_period=None,
    country=None,
    city=None,
):

    connection = get_connection()

    try:

        cursor = connection.cursor()

        cursor.execute(
            """
            INSERT INTO searches (
                telegram_id,

                search_name,

                birth_day,
                birth_month,
                birth_year,

                birth_hour,
                birth_minute,
                birth_period,

                country,
                city,

                created_at,
                result_text,
                status
            )
            VALUES (
                ?, ?,
                ?, ?, ?,
                ?, ?, ?,
                ?, ?,
                ?, ?, ?
            )
            """,
            (
                telegram_id,

                search_name,

                birth_day,
                birth_month,
                birth_year,

                birth_hour,
                birth_minute,
                birth_period,

                country,
                city,

                now_string(),
                "",
                "pending",
            ),
        )

        search_id = cursor.lastrowid

        connection.commit()

        return search_id

    finally:

        connection.close()


def get_search(
    search_id,
):

    connection = get_connection()

    try:

        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT *
            FROM searches
            WHERE id = ?
            LIMIT 1
            """,
            (
                search_id,
            ),
        )

        row = cursor.fetchone()

        if row is None:
            return None

        return dict(row)

    finally:

        connection.close()


def update_search(
    search_id,
    result_text=None,
    status=None,
):

    connection = get_connection()

    try:

        cursor = connection.cursor()

        fields = []
        values = []

        if result_text is not None:

            fields.append(
                "result_text = ?"
            )

            values.append(
                result_text
            )

        if status is not None:

            fields.append(
                "status = ?"
            )

            values.append(
                status
            )

        if not fields:
            return

        values.append(
            search_id
        )

        query = (
            "UPDATE searches "
            "SET "
            + ", ".join(fields)
            + " WHERE id = ?"
        )

        cursor.execute(
            query,
            tuple(values),
        )

        connection.commit()

    finally:

        connection.close()


# ============================================================
# USER HISTORY
# ============================================================

def get_user_searches(
    telegram_id,
    limit=10,
    offset=0,
):

    connection = get_connection()

    try:

        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT *
            FROM searches
            WHERE telegram_id = ?
            ORDER BY id DESC
            LIMIT ?
            OFFSET ?
            """,
            (
                telegram_id,
                limit,
                offset,
            ),
        )

        rows = cursor.fetchall()

        return [
            dict(row)
            for row in rows
        ]

    finally:

        connection.close()


def count_user_searches(
    telegram_id,
):

    connection = get_connection()

    try:

        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT COUNT(*)
            FROM searches
            WHERE telegram_id = ?
            """,
            (
                telegram_id,
            ),
        )

        return cursor.fetchone()[0]

    finally:

        connection.close()


# ============================================================
# ADMIN HISTORY
# ============================================================

def get_all_searches(
    limit=10,
    offset=0,
):

    connection = get_connection()

    try:

        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT *
            FROM searches
            ORDER BY id DESC
            LIMIT ?
            OFFSET ?
            """,
            (
                limit,
                offset,
            ),
        )

        rows = cursor.fetchall()

        return [
            dict(row)
            for row in rows
        ]

    finally:

        connection.close()


def count_all_searches():

    connection = get_connection()

    try:

        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT COUNT(*)
            FROM searches
            """
        )

        return cursor.fetchone()[0]

    finally:

        connection.close()


# ============================================================
# SEARCH LOGS
# ============================================================

def add_search_log(
    search_id,
    telegram_id,
    event,
    details="",
):

    connection = get_connection()

    try:

        cursor = connection.cursor()

        cursor.execute(
            """
            INSERT INTO search_logs (
                search_id,
                telegram_id,
                event,
                details,
                created_at
            )
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                search_id,
                telegram_id,
                event,
                details,
                now_string(),
            ),
        )

        connection.commit()

        return cursor.lastrowid

    finally:

        connection.close()


def get_search_logs(
    search_id,
):

    connection = get_connection()

    try:

        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT *
            FROM search_logs
            WHERE search_id = ?
            ORDER BY id ASC
            """,
            (
                search_id,
            ),
        )

        rows = cursor.fetchall()

        return [
            dict(row)
            for row in rows
        ]

    finally:

        connection.close()


def get_user_logs(
    telegram_id,
    limit=100,
):

    connection = get_connection()

    try:

        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT *
            FROM search_logs
            WHERE telegram_id = ?
            ORDER BY id DESC
            LIMIT ?
            """,
            (
                telegram_id,
                limit,
            ),
        )

        rows = cursor.fetchall()

        return [
            dict(row)
            for row in rows
        ]

    finally:

        connection.close()


# ============================================================
# STATISTICS
# ============================================================

def get_statistics():

    connection = get_connection()

    try:

        cursor = connection.cursor()

        # Users
        cursor.execute(
            """
            SELECT COUNT(*)
            FROM users
            """
        )

        total_users = (
            cursor.fetchone()[0]
        )

        # Searches
        cursor.execute(
            """
            SELECT COUNT(*)
            FROM searches
            """
        )

        total_searches = (
            cursor.fetchone()[0]
        )

        # Successful
        cursor.execute(
            """
            SELECT COUNT(*)
            FROM searches
            WHERE status = 'success'
            """
        )

        successful_searches = (
            cursor.fetchone()[0]
        )

        # Failed
        cursor.execute(
            """
            SELECT COUNT(*)
            FROM searches
            WHERE status = 'failed'
            """
        )

        failed_searches = (
            cursor.fetchone()[0]
        )

        # Pending
        cursor.execute(
            """
            SELECT COUNT(*)
            FROM searches
            WHERE status = 'pending'
            """
        )

        pending_searches = (
            cursor.fetchone()[0]
        )

        return {
            "total_users":
                total_users,

            "total_searches":
                total_searches,

            "successful_searches":
                successful_searches,

            "failed_searches":
                failed_searches,

            "pending_searches":
                pending_searches,
        }

    finally:

        connection.close()


# ============================================================
# DELETE SEARCH
# ============================================================

def delete_search(
    search_id,
):

    connection = get_connection()

    try:

        cursor = connection.cursor()

        cursor.execute(
            """
            DELETE FROM searches
            WHERE id = ?
            """,
            (
                search_id,
            ),
        )

        deleted = (
            cursor.rowcount > 0
        )

        connection.commit()

        return deleted

    finally:

        connection.close()


# ============================================================
# DELETE USER DATA
# ============================================================

def delete_user_data(
    telegram_id,
):

    connection = get_connection()

    try:

        cursor = connection.cursor()

        cursor.execute(
            """
            DELETE FROM users
            WHERE telegram_id = ?
            """,
            (
                telegram_id,
            ),
        )

        deleted = (
            cursor.rowcount > 0
        )

        connection.commit()

        return deleted

    finally:

        connection.close()


# ============================================================
# DATABASE HEALTH
# ============================================================

def database_exists():

    return DATABASE_FILE.exists()


def database_size():

    if not DATABASE_FILE.exists():
        return 0

    try:
        return DATABASE_FILE.stat().st_size
    except Exception:
        return 0


# ============================================================
# INITIALIZE ON IMPORT
# ============================================================

init_database()
