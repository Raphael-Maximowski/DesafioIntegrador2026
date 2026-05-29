"""Shared pagination helpers.

Ninja ships LimitOffsetPagination / PageNumberPagination out of the box;
re-export or customize here so all domains paginate consistently.
"""
from ninja.pagination import LimitOffsetPagination

__all__ = ["LimitOffsetPagination"]
