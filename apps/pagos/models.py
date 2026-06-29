import uuid
from django.db import models
from django.conf import settings
from apps.pedidos.models import Pedido

class Pago(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pendiente de Verificación'),
        ('APPROVED', 'Aprobado'),
        ('REJECTED', 'Rechazado'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.OneToOneField(Pedido, on_delete=models.CASCADE, related_name='pago')
    payment_method = models.CharField(max_length=50, default='BANK_TRANSFER')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    receipt_image = models.ImageField(upload_to='comprobantes/')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='pagos_verificados'
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'pago'
        verbose_name_plural = 'pagos'

    def __str__(self):
        return f"Pago de {self.amount} - Pedido: {self.order.id} ({self.get_status_display()})"
