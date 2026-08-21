"""allow multiple null emails on users

Revision ID: b3d7e9f1a5c2
Revises: a9f5c1e2d4b7
Create Date: 2026-08-14 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b3d7e9f1a5c2'
down_revision: Union[str, Sequence[str], None] = 'a9f5c1e2d4b7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    rows = bind.exec_driver_sql(
        """
        SELECT kc.name
        FROM sys.key_constraints kc
        JOIN sys.index_columns ic
             ON kc.parent_object_id = ic.object_id
            AND kc.unique_index_id = ic.index_id
        JOIN sys.columns c
             ON ic.object_id = c.object_id AND ic.column_id = c.column_id
        WHERE kc.parent_object_id = OBJECT_ID('users')
          AND kc.type = 'UQ'
          AND c.name = 'email'
        """
    ).fetchall()
    for (constraint_name,) in rows:
        op.drop_constraint(constraint_name, "users", type_="unique")
    op.create_index(
        "uq_users_email",
        "users",
        ["email"],
        unique=True,
        mssql_where=sa.text("email IS NOT NULL"),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("uq_users_email", table_name="users")
    op.create_unique_constraint("uq_users_email", "users", ["email"])
