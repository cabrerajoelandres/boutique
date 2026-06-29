from django.contrib import admin
from django import forms

from .models import Producto, ImagenProducto, VarianteProducto


class VarianteProductoInlineForm(forms.ModelForm):
    class Meta:
        model = VarianteProducto
        fields = '__all__'
        widgets = {
            'size': forms.Select(choices=[('', 'Sin talla')] + list(VarianteProducto.SIZE_CHOICES)),
        }


class VarianteProductoInline(admin.TabularInline):
    model = VarianteProducto
    form = VarianteProductoInlineForm
    extra = 1


class ImagenProductoInline(admin.TabularInline):
    model = ImagenProducto
    extra = 1


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'category', 'gender', 'is_active', 'created_at')
    list_filter = ('gender', 'is_active', 'category')
    search_fields = ('name', 'sku', 'description', 'brand')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ImagenProductoInline, VarianteProductoInline]

    fieldsets = (
        ('Información principal', {
            'fields': ('name', 'slug', 'description', 'category', 'brand', 'gender')
        }),
        ('Precios y estado', {
            'fields': ('price', 'offer_price', 'is_active', 'min_stock_alert')
        }),
        ('Imagen', {
            'fields': ('image_principal',)
        }),
    )


@admin.register(VarianteProducto)
class VarianteProductoAdmin(admin.ModelAdmin):
    list_display = ('product', 'color', 'size', 'stock', 'is_active')
    list_filter = ('size', 'is_active')
    search_fields = ('product__name', 'color', 'sku_variant')


@admin.register(ImagenProducto)
class ImagenProductoAdmin(admin.ModelAdmin):
    list_display = ('product', 'image')
