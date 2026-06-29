from rest_framework import serializers
from .models import MovimientoInventario
from apps.productos.serializers import VarianteProductoSerializer
from apps.productos.models import VarianteProducto

class MovimientoInventarioSerializer(serializers.ModelSerializer):
    variant_detail = VarianteProductoSerializer(source='variant', read_only=True)
    variant = serializers.PrimaryKeyRelatedField(queryset=VarianteProducto.objects.all())
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = MovimientoInventario
        fields = ['id', 'variant', 'variant_detail', 'movement_type', 'quantity', 'reason', 'user_email', 'created_at']
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user:
            validated_data['user'] = request.user
        return super().create(validated_data)
