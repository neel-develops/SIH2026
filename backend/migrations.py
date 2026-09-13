"""Lightweight additive schema migration for SQLite.

`Base.metadata.create_all` creates missing *tables* but never adds columns to a
table that already exists. Because the demo database is committed and long-lived,
new model columns would silently be absent at runtime. This walks the model
metadata and issues `ALTER TABLE ... ADD COLUMN` for anything missing.

Additive only: never drops or retypes an existing column.
"""

from sqlalchemy import inspect, text
from sqlalchemy.schema import CreateColumn


def _sql_default(column):
    """Render a server-side default for the ADD COLUMN clause."""
    py_default = getattr(column.default, "arg", None) if column.default is not None else None

    if callable(py_default):
        return None  # e.g. `list` / `datetime.utcnow` — leave NULL, app fills it in
    if py_default is None:
        return None
    if isinstance(py_default, bool):
        return "1" if py_default else "0"
    if isinstance(py_default, (int, float)):
        return str(py_default)
    if isinstance(py_default, str):
        escaped = py_default.replace("'", "''")
        return f"'{escaped}'"
    return None


def run_migrations(engine, base):
    """Add any model columns that are missing from the live SQLite schema."""
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    added = []

    with engine.begin() as conn:
        for table_name, table in base.metadata.tables.items():
            if table_name not in existing_tables:
                continue  # create_all handles brand-new tables

            live_columns = {c["name"] for c in inspector.get_columns(table_name)}

            for column in table.columns:
                if column.name in live_columns:
                    continue

                # SQLite cannot add a NOT NULL column without a constant default.
                ddl = CreateColumn(column).compile(engine).string
                ddl = ddl.replace(" NOT NULL", "")

                default_sql = _sql_default(column)
                if default_sql is not None:
                    ddl += f" DEFAULT {default_sql}"

                conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {ddl}"))
                added.append(f"{table_name}.{column.name}")

    if added:
        print(f"[migrations] added {len(added)} column(s): {', '.join(added)}")
    return added
