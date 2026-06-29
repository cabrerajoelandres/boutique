from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, F
from .models import MovimientoInventario
from .serializers import MovimientoInventarioSerializer
from apps.productos.models import VarianteProducto
from apps.usuarios.permissions import IsAdminUser

class InventarioViewSet(viewsets.ModelViewSet):
    queryset = MovimientoInventario.objects.all().select_related('variant__product', 'user')
    serializer_class = MovimientoInventarioSerializer
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=['get'], url_path='status')
    def inventory_status(self, request):
        # Stock total sumando todas las variantes activas
        total_stock = VarianteProducto.objects.filter(is_active=True).aggregate(total=Sum('stock'))['total'] or 0
        
        # Productos (variantes) agotados
        out_of_stock = VarianteProducto.objects.filter(stock=0, is_active=True).count()
        
        # Productos (variantes) con poco stock (stock <= min_stock_alert de su producto padre)
        low_stock_variants = VarianteProducto.objects.filter(
            is_active=True,
            stock__gt=0,
            stock__lte=F('product__min_stock_alert')
        )
        low_stock_count = low_stock_variants.count()

        # Lista detallada de items con poco stock para alertas
        low_stock_list = []
        for var in low_stock_variants[:20]:  # Mostrar los primeros 20 para alertar
            low_stock_list.append({
                'id': var.id,
                'product_name': var.product.name,
                'color': var.color,
                'size': var.size,
                'stock': var.stock,
                'min_alert': var.product.min_stock_alert,
                'sku': var.sku_variant
            })

        return Response({
            'total_stock': total_stock,
            'out_of_stock_count': out_of_stock,
            'low_stock_count': low_stock_count,
            'low_stock_items': low_stock_list
        })
