"""make tax_no non-unique

Revision ID: 62cf03f42f9f
Revises: 2a6c719950df
Create Date: 2026-08-13 08:11:14.397148

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '62cf03f42f9f'
down_revision: Union[str, Sequence[str], None] = '2a6c719950df'
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
        WHERE kc.parent_object_id = OBJECT_ID('customers')
          AND kc.type = 'UQ'
          AND c.name = 'tax_no'
        """
    ).fetchall()
    for (constraint_name,) in rows:
        op.drop_constraint(constraint_name, "customers", type_="unique")


def downgrade() -> None:
    """Downgrade schema."""
    op.create_unique_constraint("uq_customers_tax_no", "customers", ["tax_no"])
