"""numeric_counters_indexes

Revision ID: 002_numeric_counters_indexes
Revises: 001_initial_tables
Create Date: 2026-11-21 20:31:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '002_numeric_counters_indexes'
down_revision: Union[str, Sequence[str], None] = '001_initial_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create doc_counters table
    op.create_table(
        'doc_counters',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('doc_type', sa.String(length=10), nullable=False),
        sa.Column('fin_year', sa.String(length=10), nullable=False),
        sa.Column('last_val', sa.Integer(), server_default='0', nullable=False),
        sa.UniqueConstraint('doc_type', 'fin_year', name='uq_doc_counter_type_fy'),
    )
    op.create_index('ix_doc_counters_doc_type', 'doc_counters', ['doc_type'], unique=False)
    op.create_index('ix_doc_counters_fin_year', 'doc_counters', ['fin_year'], unique=False)

    # 2. Alter users indexes
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.create_index('ix_users_role', ['role'], unique=False)

    # 3. Alter categories indexes
    with op.batch_alter_table('categories', schema=None) as batch_op:
        batch_op.create_index('ix_categories_name', ['name'], unique=True)

    # 4. Alter vendors indexes
    with op.batch_alter_table('vendors', schema=None) as batch_op:
        batch_op.create_index('ix_vendors_name', ['name'], unique=False)

    # 5. Alter items: Numeric columns and indexes
    with op.batch_alter_table('items', schema=None) as batch_op:
        batch_op.alter_column('min_stock', existing_type=sa.Float(), type_=sa.Numeric(precision=14, scale=3), existing_nullable=False)
        batch_op.alter_column('qty', existing_type=sa.Float(), type_=sa.Numeric(precision=14, scale=3), existing_nullable=False)
        batch_op.alter_column('price', existing_type=sa.Float(), type_=sa.Numeric(precision=14, scale=2), existing_nullable=False)
        batch_op.create_index('ix_items_category_id', ['category_id'], unique=False)
        batch_op.create_index('ix_items_name', ['name'], unique=False)
        batch_op.create_index('ix_items_qty', ['qty'], unique=False)

    # 6. Alter txns: unit_cost and Numeric qty, indexes
    with op.batch_alter_table('txns', schema=None) as batch_op:
        batch_op.add_column(sa.Column('unit_cost', sa.Numeric(precision=14, scale=2), server_default='0.00', nullable=False))
        batch_op.alter_column('qty', existing_type=sa.Float(), type_=sa.Numeric(precision=14, scale=3), existing_nullable=False)
        batch_op.create_index('ix_txns_at', ['at'], unique=False)
        batch_op.create_index('ix_txns_kind', ['kind'], unique=False)
        batch_op.create_index('ix_txns_ref', ['ref'], unique=False)
        batch_op.create_index('ix_txns_user_id', ['user_id'], unique=False)

    # 7. Alter indents: indexes
    with op.batch_alter_table('indents', schema=None) as batch_op:
        batch_op.create_index('ix_indents_at', ['at'], unique=False)
        batch_op.create_index('ix_indents_by_id', ['by_id'], unique=False)
        batch_op.create_index('ix_indents_dept', ['dept'], unique=False)
        batch_op.create_index('ix_indents_no', ['no'], unique=True)
        batch_op.create_index('ix_indents_status', ['status'], unique=False)

    # 8. Alter indent_lines: approved_qty and Numeric qty, indexes
    with op.batch_alter_table('indent_lines', schema=None) as batch_op:
        batch_op.add_column(sa.Column('approved_qty', sa.Numeric(precision=14, scale=3), nullable=True))
        batch_op.alter_column('qty', existing_type=sa.Float(), type_=sa.Numeric(precision=14, scale=3), existing_nullable=False)
        batch_op.create_index('ix_indent_lines_indent_id', ['indent_id'], unique=False)
        batch_op.create_index('ix_indent_lines_item_id', ['item_id'], unique=False)

    # 9. Alter purchase_orders: indexes
    with op.batch_alter_table('purchase_orders', schema=None) as batch_op:
        batch_op.create_index('ix_purchase_orders_at', ['at'], unique=False)
        batch_op.create_index('ix_purchase_orders_by_id', ['by_id'], unique=False)
        batch_op.create_index('ix_purchase_orders_no', ['no'], unique=True)
        batch_op.create_index('ix_purchase_orders_status', ['status'], unique=False)
        batch_op.create_index('ix_purchase_orders_vendor_id', ['vendor_id'], unique=False)

    # 10. Alter po_lines: Numeric qty, rate, got, indexes
    with op.batch_alter_table('po_lines', schema=None) as batch_op:
        batch_op.alter_column('qty', existing_type=sa.Float(), type_=sa.Numeric(precision=14, scale=3), existing_nullable=False)
        batch_op.alter_column('rate', existing_type=sa.Float(), type_=sa.Numeric(precision=14, scale=2), existing_nullable=False)
        batch_op.alter_column('got', existing_type=sa.Float(), type_=sa.Numeric(precision=14, scale=3), existing_nullable=False)
        batch_op.create_index('ix_po_lines_item_id', ['item_id'], unique=False)
        batch_op.create_index('ix_po_lines_po_id', ['po_id'], unique=False)

    # 11. Alter writeoffs: Numeric qty, indexes
    with op.batch_alter_table('writeoffs', schema=None) as batch_op:
        batch_op.alter_column('qty', existing_type=sa.Float(), type_=sa.Numeric(precision=14, scale=3), existing_nullable=False)
        batch_op.create_index('ix_writeoffs_at', ['at'], unique=False)
        batch_op.create_index('ix_writeoffs_by_id', ['by_id'], unique=False)
        batch_op.create_index('ix_writeoffs_item_id', ['item_id'], unique=False)
        batch_op.create_index('ix_writeoffs_no', ['no'], unique=True)
        batch_op.create_index('ix_writeoffs_status', ['status'], unique=False)

    # 12. Alter audit: request_id, before_state, after_state, user_id nullable, indexes
    with op.batch_alter_table('audit', schema=None) as batch_op:
        batch_op.add_column(sa.Column('request_id', sa.String(length=64), server_default='', nullable=False))
        batch_op.add_column(sa.Column('before_state', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('after_state', sa.JSON(), nullable=True))
        batch_op.alter_column('user_id', existing_type=sa.Integer(), nullable=True)
        batch_op.create_index('ix_audit_at', ['at'], unique=False)
        batch_op.create_index('ix_audit_request_id', ['request_id'], unique=False)
        batch_op.create_index('ix_audit_user_id', ['user_id'], unique=False)

    # 13. Alter notices: indexes
    with op.batch_alter_table('notices', schema=None) as batch_op:
        batch_op.create_index('ix_notices_at', ['at'], unique=False)
        batch_op.create_index('ix_notices_ref_no', ['ref_no'], unique=False)


def downgrade() -> None:
    op.drop_table('doc_counters')
