"""
Custom DRF permission classes for role-based access control.

Classes
-------
IsAdminRole
    Allows access only to authenticated users whose role == 'admin'.
    Use for strictly admin-only actions.

IsAuthenticatedReadOnly
    All authenticated users may use safe HTTP methods (GET, HEAD, OPTIONS).
    Only users with role == 'admin' may use write methods (POST, PUT, PATCH, DELETE).
    Unauthenticated requests are always rejected.
"""

from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminRole(BasePermission):
    """
    Grants access only if the requesting user is authenticated
    and has role == 'admin'.
    """

    message = "Access denied: admin role required for this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == "admin"
        )


class IsAuthenticatedReadOnly(BasePermission):
    """
    Authenticated users (any role) can use safe methods.
    Write methods are restricted to users with role == 'admin'.

    HTTP method mapping
    -------------------
    GET, HEAD, OPTIONS  → any authenticated user (admin OR viewer)
    POST, PUT, PATCH, DELETE → admin role only
    """

    message = (
        "Access denied: you must be authenticated. "
        "Write operations require the admin role."
    )

    def has_permission(self, request, view):
        # Must be authenticated at minimum
        if not request.user or not request.user.is_authenticated:
            return False

        # Safe methods → any authenticated user
        if request.method in SAFE_METHODS:
            return True

        # Write methods → admin only
        return getattr(request.user, "role", None) == "admin"
