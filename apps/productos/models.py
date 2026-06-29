from django.db import models
from django.utils.text import slugify
from apps.categorias.models import Categoria

class Producto(models.Model):
    sku = models.CharField(max_length=50, unique=True, blank=True)
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=250, unique=True, blank=True)
    description = models.TextField()
    category = models.ForeignKey(Categoria, on_delete=models.CASCADE, related_name='productos')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    offer_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    brand = models.CharField(max_length=100, blank=True, null=True)
    image_principal = models.ImageField(upload_to='productos/principal/')
    GENDER_CHOICES = [
        ('HOMBRE', 'Hombre'),
        ('MUJER', 'Mujer'),
        ('UNISEX', 'Unisex'),
    ]
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default='UNISEX')
    is_active = models.BooleanField(default=True)
    min_stock_alert = models.PositiveIntegerField(default=5, help_text="Alerta cuando el stock sea menor o igual a este valor")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'producto'
        verbose_name_plural = 'productos'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.sku:
            import uuid
            self.sku = f"BTQ-{uuid.uuid4().hex[:8].upper()}"
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.sku})"

class ImagenProducto(models.Model):
    product = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='imagenes_adicionales')
    image = models.ImageField(upload_to='productos/galeria/')

    class Meta:
        verbose_name = 'imagen adicional'
        verbose_name_plural = 'imágenes adicionales'

    def __str__(self):
        return f"Imagen para {self.product.name}"

class VarianteProducto(models.Model):
    SIZE_CHOICES = [
        ('XS', 'XS - Extra Small'),
        ('S', 'S - Small'),
        ('M', 'M - Medium'),
        ('L', 'L - Large'),
        ('XL', 'XL'),
    ]

    product = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='variantes')
    color = models.CharField(max_length=50)
    size = models.CharField(max_length=20, choices=SIZE_CHOICES, blank=True, null=True)
    image = models.ImageField(upload_to='productos/variantes/', blank=True, null=True, help_text="Imagen específica para este color")
    stock = models.IntegerField(default=0)
    sku_variant = models.CharField(max_length=100, unique=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'variante de producto'
        verbose_name_plural = 'variantes de producto'
        unique_together = ('product', 'color', 'size')

    def save(self, *args, **kwargs):
        if not self.sku_variant:
            suffix = f"-{self.color}"
            if self.size:
                suffix += f"-{self.size}"
            self.sku_variant = f"{self.product.sku}{suffix}".replace(" ", "")
        super().save(*args, **kwargs)

    def __str__(self):
        talla_str = f" - Talla: {self.size}" if self.size else ""
        return f"{self.product.name} (Color: {self.color}{talla_str})"
