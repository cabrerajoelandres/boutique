from django.db import models
from django.conf import settings
from apps.productos.models import VarianteProducto

class MovimientoInventario(models.Model):
    TIPO_MOVIMIENTO = (
        ('IN', 'Entrada (Compra/Reabastecimiento)'),
        ('OUT', 'Salida (Venta)'),
        ('ADJUSTMENT', 'Ajuste Manual'),
    )

    variant = models.ForeignKey(VarianteProducto, on_delete=models.CASCADE, related_name='movimientos')
    movement_type = models.CharField(max_length=15, choices=TIPO_MOVIMIENTO)
    quantity = models.IntegerField(help_text="Cantidad del movimiento (usar valores positivos)")
    reason = models.CharField(max_length=255, blank=True, null=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'movimiento de inventario'
        verbose_name_plural = 'movimientos de inventario'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.pk:  # Solo cuando se crea por primera vez
            if self.movement_type == 'IN':
                self.variant.stock += self.quantity
            elif self.movement_type == 'OUT':
                self.variant.stock -= self.quantity
            elif self.movement_type == 'ADJUSTMENT':
                # En ajuste manual, el valor de 'quantity' puede ser positivo o negativo
                self.variant.stock += self.quantity
            
            self.variant.save()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.get_movement_type_display()} - {self.quantity} uds - {self.variant}"
