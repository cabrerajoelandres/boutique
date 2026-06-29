from rest_framework import serializers
from .models import Carrito, ItemCarrito
from apps.productos.serializers import VarianteProductoSerializer
from apps.productos.models import VarianteProducto

class ItemCarritoSerializer(serializers.ModelSerializer):
    variant_detail = VarianteProductoSerializer(source='variant', read_only=True)
    variant = serializers.PrimaryKeyRelatedField(queryset=VarianteProducto.objects.filter(is_active=True))
    subtotal = serializers.ReadOnlyField()

    class Meta:
        model = ItemCarrito
        fields = ['id', 'variant', 'variant_detail', 'quantity', 'subtotal']

    def validate(self, data):
        variant = data['variant']
        quantity = data['quantity']
        if variant.stock < quantity:
            raise serializers.ValidationError({"quantity": f"Solo quedan {variant.stock} unidades disponibles para esta variante."})
        return data

class CarritoSerializer(serializers.ModelSerializer):
    items = ItemCarritoSerializer(many=True, read_only=True)
    total = serializers.ReadOnlyField()

    class Meta:
        model = Carrito
        fields = ['id', 'items', 'total']
