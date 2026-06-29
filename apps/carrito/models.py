import uuid
from django.db import models
from django.conf import settings
from apps.productos.models import VarianteProducto

class Carrito(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='carrito')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'carrito'
        verbose_name_plural = 'carritos'

    @property
    def total(self):
        return sum(item.subtotal for item in self.items.all())

    def __str__(self):
        return f"Carrito de {self.user.email}"

class ItemCarrito(models.Model):
    cart = models.ForeignKey(Carrito, on_delete=models.CASCADE, related_name='items')
    variant = models.ForeignKey(VarianteProducto, on_delete=models.CASCADE, related_name='en_carritos')
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        verbose_name = 'item de carrito'
        verbose_name_plural = 'items de carrito'
        unique_together = ('cart', 'variant')

    @property
    def subtotal(self):
        precio = self.variant.product.offer_price if self.variant.product.offer_price else self.variant.product.price
        return precio * self.quantity

    def __str__(self):
        return f"{self.quantity} x {self.variant}"
