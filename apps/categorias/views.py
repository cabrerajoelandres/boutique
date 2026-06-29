from rest_framework import viewsets
from .models import Categoria
from .serializers import CategoriaSerializer
from apps.usuarios.permissions import IsAdminOrReadOnly

class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = 'id'

    def get_queryset(self):
        queryset = Categoria.objects.all()
        # Si el usuario no es Admin, solo ve categorías activas
        user = self.request.user
        is_admin = user and user.is_authenticated and user.role == 'Admin'
        if not is_admin:
            queryset = queryset.filter(is_active=True)
        return queryset
