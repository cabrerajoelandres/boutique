import datetime
from django.utils import timezone
from django.db.models import Sum, Count
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.usuarios.permissions import IsAdminUser
from apps.productos.models import Producto, VarianteProducto
from apps.pedidos.models import Pedido, ItemPedido
from django.contrib.auth import get_user_model

Usuario = get_user_model()

class DashboardStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        today = timezone.now().date()
        start_of_month = today.replace(day=1)
        
        # 1. Métricas clave (Tarjetas)
        total_products = Producto.objects.filter(is_active=True).count()
        out_of_stock_products = VarianteProducto.objects.filter(stock=0, is_active=True).values('product').distinct().count()
        
        pending_orders = Pedido.objects.filter(status__in=['PENDING', 'PAYMENT_TO_VERIFY']).count()
        delivered_orders = Pedido.objects.filter(status='DELIVERED').count()
        
        # Solo consideramos ventas reales (pedidos aprobados, en preparación, enviados o entregados)
        valid_sale_statuses = ['PAYMENT_APPROVED', 'PREPARING', 'SHIPPED', 'DELIVERED']
        
        month_sales = Pedido.objects.filter(
            status__in=valid_sale_statuses,
            created_at__date__gte=start_of_month
        ).aggregate(total=Sum('total'))['total'] or 0.00
        
        day_sales = Pedido.objects.filter(
            status__in=valid_sale_statuses,
            created_at__date=today
        ).aggregate(total=Sum('total'))['total'] or 0.00
        
        total_clients = Usuario.objects.filter(role='Client', is_active=True).count()
        
        total_revenue = Pedido.objects.filter(
            status__in=valid_sale_statuses
        ).aggregate(total=Sum('total'))['total'] or 0.00

        # 2. Ventas mensuales (últimos 6 meses)
        sales_by_month = []
        for i in range(5, -1, -1):
            # Restar i meses de forma aproximada
            month_date = today - datetime.timedelta(days=i*30)
            m_start = month_date.replace(day=1)
            
            # Obtener el inicio del mes siguiente
            if m_start.month == 12:
                m_end = m_start.replace(year=m_start.year+1, month=1)
            else:
                m_end = m_start.replace(month=m_start.month+1)
                
            month_total = Pedido.objects.filter(
                status__in=valid_sale_statuses,
                created_at__gte=m_start,
                created_at__lt=m_end
            ).aggregate(total=Sum('total'))['total'] or 0.00
            
            month_count = Pedido.objects.filter(
                status__in=valid_sale_statuses,
                created_at__gte=m_start,
                created_at__lt=m_end
            ).count()
            
            sales_by_month.append({
                'month': m_start.strftime('%b %Y'),
                'sales': float(month_total),
                'orders_count': month_count
            })

        # 3. Productos más vendidos (Top 5)
        top_products_query = ItemPedido.objects.filter(
            order__status__in=valid_sale_statuses
        ).values(
            'variant__product__name'
        ).annotate(
            total_sold=Sum('quantity')
        ).order_by('-total_sold')[:5]
        
        top_products = [
            {'name': item['variant__product__name'], 'sold': item['total_sold']}
            for item in top_products_query
        ]

        # 4. Categorías más vendidas (Top 5)
        top_categories_query = ItemPedido.objects.filter(
            order__status__in=valid_sale_statuses
        ).values(
            'variant__product__category__name'
        ).annotate(
            total_sold=Sum('quantity'),
            total_revenue=Sum('price')
        ).order_by('-total_sold')[:5]
        
        top_categories = [
            {
                'name': item['variant__product__category__name'],
                'sold': item['total_sold'],
                'revenue': float(item['total_revenue'] or 0)
            }
            for item in top_categories_query
        ]

        # 5. Distribución de pedidos por estado
        orders_by_status_query = Pedido.objects.values('status').annotate(count=Count('id'))
        status_mapping = dict(Pedido.STATUS_CHOICES)
        orders_by_status = [
            {'status': status_mapping.get(item['status'], item['status']), 'count': item['count']}
            for item in orders_by_status_query
        ]

        return Response({
            'summary': {
                'total_products': total_products,
                'out_of_stock_products': out_of_stock_products,
                'pending_orders': pending_orders,
                'delivered_orders': delivered_orders,
                'month_sales': float(month_sales),
                'day_sales': float(day_sales),
                'total_clients': total_clients,
                'total_revenue': float(total_revenue)
            },
            'sales_by_month': sales_by_month,
            'top_products': top_products,
            'top_categories': top_categories,
            'orders_by_status': orders_by_status
        })
