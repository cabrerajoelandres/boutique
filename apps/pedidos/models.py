import uuid
from django.db import models
from django.conf import settings
from apps.productos.models import VarianteProducto

class Pedido(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pendiente de Pago'),
        ('PAYMENT_TO_VERIFY', 'Pago por verificar'),
        ('PAYMENT_APPROVED', 'Pago aprobado'),
        ('PREPARING', 'Preparando pedido'),
        ('SHIPPED', 'Enviado'),
        ('DELIVERED', 'Entregado'),
        ('CANCELLED', 'Cancelado'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='pedidos')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    # Detalles financieros
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Dirección de envío (Snapshot del momento de la compra)
    shipping_address = models.JSONField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'pedido'
        verbose_name_plural = 'pedidos'
        ordering = ['-created_at']

    def __str__(self):
        return f"Pedido {self.id} - {self.user.email} - {self.get_status_display()}"

class ItemPedido(models.Model):
    order = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='items')
    variant = models.ForeignKey(VarianteProducto, on_delete=models.PROTECT, related_name='en_pedidos')
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)  # Precio histórico de compra

    class Meta:
        verbose_name = 'item de pedido'
        verbose_name_plural = 'items de pedido'

    @property
    def subtotal(self):
        return self.price * self.quantity

    def __str__(self):
        return f"{self.quantity} x {self.variant} (Pedido: {self.order.id})"
