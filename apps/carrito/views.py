from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Carrito, ItemCarrito
from .serializers import CarritoSerializer, ItemCarritoSerializer

class CarritoViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        # Obtener o crear el carrito para el usuario autenticado
        carrito, _ = Carrito.objects.get_or_create(user=request.user)
        serializer = CarritoSerializer(carrito)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='items')
    def add_item(self, request):
        carrito, _ = Carrito.objects.get_or_create(user=request.user)
        serializer = ItemCarritoSerializer(data=request.data)
        if serializer.is_valid():
            variant = serializer.validated_data['variant']
            quantity = serializer.validated_data['quantity']
            
            # Si el item ya está en el carrito, se suma la cantidad
            item, created = ItemCarrito.objects.get_or_create(cart=carrito, variant=variant)
            if not created:
                nueva_cantidad = item.quantity + quantity
                # Validar stock para la cantidad total acumulada
                if variant.stock < nueva_cantidad:
                    return Response(
                        {"quantity": f"No hay suficiente stock disponible. Solicitado: {nueva_cantidad}, Disponible: {variant.stock}."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                item.quantity = nueva_cantidad
            else:
                item.quantity = quantity
                
            item.save()
            return Response(CarritoSerializer(carrito).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['put', 'patch'], url_path='items-update')
    def update_item(self, request, pk=None):
        try:
            item = ItemCarrito.objects.get(id=pk, cart__user=request.user)
        except ItemCarrito.DoesNotExist:
            return Response({"detail": "Item no encontrado en el carrito."}, status=status.HTTP_404_NOT_FOUND)
            
        quantity = request.data.get('quantity')
        if quantity is None or int(quantity) <= 0:
            return Response({"quantity": "La cantidad debe ser mayor a 0."}, status=status.HTTP_400_BAD_REQUEST)
            
        quantity = int(quantity)
        if item.variant.stock < quantity:
            return Response(
                {"quantity": f"Solo quedan {item.variant.stock} unidades disponibles."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        item.quantity = quantity
        item.save()
        return Response(CarritoSerializer(item.cart).data)

    @action(detail=True, methods=['delete'], url_path='items-delete')
    def delete_item(self, request, pk=None):
        try:
            item = ItemCarrito.objects.get(id=pk, cart__user=request.user)
        except ItemCarrito.DoesNotExist:
            return Response({"detail": "Item no encontrado en el carrito."}, status=status.HTTP_404_NOT_FOUND)
            
        carrito = item.cart
        item.delete()
        return Response(CarritoSerializer(carrito).data)
