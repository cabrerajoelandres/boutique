from rest_framework import permissions

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Permiso personalizado que permite lectura a cualquier usuario (SAFE_METHODS),
    pero requiere estar autenticado y tener el rol de 'Admin' para realizar modificaciones.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated and request.user.role == 'Admin'

class IsAdminUser(permissions.BasePermission):
    """
    Permiso que restringe el acceso únicamente a usuarios con rol 'Admin'.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'Admin'
