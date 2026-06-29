from rest_framework import viewsets
from django.db import models
from .models import Producto
from .serializers import ProductoSerializer
from apps.usuarios.permissions import IsAdminOrReadOnly

class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = 'slug'

    def get_queryset(self):
        # Optimizar consultas con prefetch_related para evitar el problema N+1
        queryset = Producto.objects.all().select_related('category').prefetch_related(
            'imagenes_adicionales', 
            'variantes'
        )
        
        # Solo ver activos, a menos que el usuario sea Admin y lo pida explícitamente (all_products=true)
        # o cuando se trate de acciones de edición/eliminación (update, partial_update, destroy)
        user = self.request.user
        is_admin = user and user.is_authenticated and user.role == 'Admin'
        show_all = self.request.query_params.get('all_products') == 'true' or self.action in ['update', 'partial_update', 'destroy']
        
        if not (is_admin and show_all):
            queryset = queryset.filter(is_active=True)
            
        # Filtros personalizados
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
            
        search_query = self.request.query_params.get('search')
        if search_query:
            queryset = queryset.filter(
                models.Q(name__icontains=search_query) | 
                models.Q(description__icontains=search_query) |
                models.Q(sku__icontains=search_query)
            )
            
        on_offer = self.request.query_params.get('offer')
        if on_offer == 'true':
            queryset = queryset.filter(offer_price__isnull=False)
            
        return queryset
