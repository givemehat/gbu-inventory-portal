"""initial_tables

Revision ID: 001_initial_tables
Revises: 
Create Date: 2026-11-21 20:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial_tables'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=120), nullable=False),
        sa.Column('pw', sa.String(length=100), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False),
        sa.Column('dept', sa.String(length=80), server_default='', nullable=False),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    op.create_table(
        'categories',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(length=80), nullable=False),
    )

    op.create_table(
        'vendors',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(length=120), nullable=False),
        sa.Column('phone', sa.String(length=30), server_default='', nullable=False),
        sa.Column('email', sa.String(length=120), server_default='', nullable=False),
    )

    op.create_table(
        'items',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('code', sa.String(length=30), nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('category_id', sa.Integer(), sa.ForeignKey('categories.id'), nullable=False),
        sa.Column('unit', sa.String(length=20), server_default='pcs', nullable=False),
        sa.Column('min_stock', sa.Float(), server_default='0', nullable=False),
        sa.Column('qty', sa.Float(), server_default='0', nullable=False),
        sa.Column('price', sa.Float(), server_default='0', nullable=False),
        sa.Column('location', sa.String(length=60), server_default='', nullable=False),
    )
    op.create_index('ix_items_code', 'items', ['code'], unique=True)

    op.create_table(
        'txns',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('item_id', sa.Integer(), sa.ForeignKey('items.id'), nullable=False),
        sa.Column('kind', sa.String(length=12), nullable=False),
        sa.Column('qty', sa.Float(), nullable=False),
        sa.Column('ref', sa.String(length=40), server_default='', nullable=False),
        sa.Column('note', sa.String(length=255), server_default='', nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('at', sa.DateTime(), nullable=False),
    )

    op.create_table(
        'indents',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('no', sa.String(length=30), server_default='', nullable=False),
        sa.Column('dept', sa.String(length=80), nullable=False),
        sa.Column('note', sa.String(length=255), server_default='', nullable=False),
        sa.Column('status', sa.String(length=12), server_default='PENDING', nullable=False),
        sa.Column('remark', sa.String(length=255), server_default='', nullable=False),
        sa.Column('by_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('decided_by', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('at', sa.DateTime(), nullable=False),
    )

    op.create_table(
        'indent_lines',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('indent_id', sa.Integer(), sa.ForeignKey('indents.id'), nullable=False),
        sa.Column('item_id', sa.Integer(), sa.ForeignKey('items.id'), nullable=False),
        sa.Column('qty', sa.Float(), nullable=False),
    )

    op.create_table(
        'purchase_orders',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('no', sa.String(length=30), server_default='', nullable=False),
        sa.Column('vendor_id', sa.Integer(), sa.ForeignKey('vendors.id'), nullable=False),
        sa.Column('indent_id', sa.Integer(), sa.ForeignKey('indents.id'), nullable=True),
        sa.Column('status', sa.String(length=12), server_default='OPEN', nullable=False),
        sa.Column('by_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('at', sa.DateTime(), nullable=False),
    )

    op.create_table(
        'po_lines',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('po_id', sa.Integer(), sa.ForeignKey('purchase_orders.id'), nullable=False),
        sa.Column('item_id', sa.Integer(), sa.ForeignKey('items.id'), nullable=False),
        sa.Column('qty', sa.Float(), nullable=False),
        sa.Column('rate', sa.Float(), server_default='0', nullable=False),
        sa.Column('got', sa.Float(), server_default='0', nullable=False),
    )

    op.create_table(
        'writeoffs',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('no', sa.String(length=30), server_default='', nullable=False),
        sa.Column('item_id', sa.Integer(), sa.ForeignKey('items.id'), nullable=False),
        sa.Column('qty', sa.Float(), nullable=False),
        sa.Column('reason', sa.String(length=255), nullable=False),
        sa.Column('status', sa.String(length=12), server_default='PENDING', nullable=False),
        sa.Column('remark', sa.String(length=255), server_default='', nullable=False),
        sa.Column('by_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('decided_by', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('at', sa.DateTime(), nullable=False),
    )

    op.create_table(
        'audit',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('action', sa.String(length=255), nullable=False),
        sa.Column('at', sa.DateTime(), nullable=False),
    )

    op.create_table(
        'notices',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('ref_no', sa.String(length=50), server_default='', nullable=False),
        sa.Column('by', sa.String(length=100), server_default='Stores & Purchase Office', nullable=False),
        sa.Column('at', sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    for tbl in [
        'notices', 'audit', 'writeoffs', 'po_lines', 'purchase_orders',
        'indent_lines', 'indents', 'txns', 'items', 'vendors', 'categories', 'users'
    ]:
        op.drop_table(tbl)
