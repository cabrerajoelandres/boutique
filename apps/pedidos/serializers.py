from django.db import transaction
from rest_framework import serializers
from .models import Pedido, ItemPedido
from apps.carrito.models import Carrito
from apps.productos.models import VarianteProducto
from apps.inventario.models import MovimientoInventario
from apps.pagos.serializers import PagoSerializer
from apps.productos.serializers import VarianteProductoSerializer

class ItemPedidoSerializer(serializers.ModelSerializer):
    variant_detail = VarianteProductoSerializer(source='variant', read_only=True)
    subtotal = serializers.ReadOnlyField()

    class Meta:
        model = ItemPedido
        fields = ['id', 'variant', 'variant_detail', 'quantity', 'price', 'subtotal']

class PedidoSerializer(serializers.ModelSerializer):
    items = ItemPedidoSerializer(many=True, read_only=True)
    pago = PagoSerializer(read_only=True)
    
    class Meta:
        model = Pedido
        fields = [
            'id', 'status', 'subtotal', 'shipping_cost', 'tax', 'total', 
            'shipping_address', 'items', 'pago', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'status', 'subtotal', 'shipping_cost', 'tax', 'total', 'created_at', 'updated_at']

    def create(self, validated_data):
        user = self.context['request'].user
        shipping_address = validated_data.get('shipping_address')
        
        if not shipping_address:
            raise serializers.ValidationError({"shipping_address": "La dirección de envío es requerida."})

        # Obtener el carrito del usuario
        try:
            carrito = Carrito.objects.get(user=user)
        except Carrito.DoesNotExist:
            raise serializers.ValidationError({"detail": "El carrito está vacío."})

        items_carrito = carrito.items.all()
        if not items_carrito.exists():
            raise serializers.ValidationError({"detail": "El carrito está vacío."})

        # Operación atómica para evitar inconsistencia de datos
        with transaction.atomic():
            subtotal = carrito.total
            shipping_cost = 5.00  # Costo fijo de envío para este ejemplo
            tax = subtotal * 0.12  # IVA 12%
            total = subtotal + shipping_cost + tax

            # Crear el pedido
            pedido = Pedido.objects.create(
                user=user,
                status='PENDING',
                subtotal=subtotal,
                shipping_cost=shipping_cost,
                tax=tax,
                total=total,
                shipping_address=shipping_address
            )

            # Procesar cada item del carrito
            for item in items_carrito:
                variant = item.variant
                
                # Bloqueo de fila para evitar condiciones de carrera (Race Conditions)
                variant = VarianteProducto.objects.select_for_update().get(id=variant.id)
                if variant.stock < item.quantity:
                    raise serializers.ValidationError(
                        {"detail": f"Stock insuficiente para {variant.product.name} ({variant.color}). Disponible: {variant.stock}."}
                    )
                
                # Obtener el precio de compra (oferta o normal)
                precio_compra = variant.product.offer_price if variant.product.offer_price else variant.product.price
                
                # Registrar item del pedido
                ItemPedido.objects.create(
                    order=pedido,
                    variant=variant,
                    quantity=item.quantity,
                    price=precio_compra
                )
                
                # Registrar movimiento de inventario (actualiza el stock automáticamente en su save)
                MovimientoInventario.objects.create(
                    variant=variant,
                    movement_type='OUT',
                    quantity=item.quantity,
                    reason=f"Venta - Pedido {pedido.id}",
                    user=user
                )

            # Vaciar el carrito
            items_carrito.delete()

        return pedido
