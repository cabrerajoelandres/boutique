from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Pedido
from .serializers import PedidoSerializer
from apps.pagos.models import Pago
from apps.usuarios.permissions import IsAdminUser
from django.utils import timezone

class PedidoViewSet(viewsets.ModelViewSet):
    serializer_class = PedidoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'Admin':
            return Pedido.objects.all().prefetch_related('items', 'pago')
        return Pedido.objects.filter(user=user).prefetch_related('items', 'pago')

    @action(detail=True, methods=['post'], url_path='upload-receipt')
    def upload_receipt(self, request, pk=None):
        try:
            pedido = Pedido.objects.get(id=pk, user=request.user)
        except Pedido.DoesNotExist:
            return Response({"detail": "Pedido no encontrado."}, status=status.HTTP_404_NOT_FOUND)

        if pedido.status not in ['PENDING', 'PAYMENT_TO_VERIFY']:
            return Response({"detail": "Solo se puede subir comprobante a un pedido pendiente."}, status=status.HTTP_400_BAD_REQUEST)

        receipt_image = request.FILES.get('receipt_image')
        if not receipt_image:
            return Response({"receipt_image": "El archivo del comprobante es obligatorio."}, status=status.HTTP_400_BAD_REQUEST)

        # Crear o actualizar el registro de Pago
        pago, created = Pago.objects.get_or_create(
            order=pedido,
            defaults={'amount': pedido.total, 'receipt_image': receipt_image, 'status': 'PENDING'}
        )
        if not created:
            pago.receipt_image = receipt_image
            pago.status = 'PENDING'
            pago.save()

        # Cambiar el estado del pedido a 'Pago por verificar'
        pedido.status = 'PAYMENT_TO_VERIFY'
        pedido.save()

        return Response(PedidoSerializer(pedido).data)

    @action(detail=True, methods=['patch'], url_path='status', permission_classes=[IsAdminUser])
    def update_status(self, request, pk=None):
        try:
            pedido = Pedido.objects.get(id=pk)
        except Pedido.DoesNotExist:
            return Response({"detail": "Pedido no encontrado."}, status=status.HTTP_404_NOT_FOUND)

        nuevo_estado = request.data.get('status')
        estados_validos = [choice[0] for choice in Pedido.STATUS_CHOICES]
        if nuevo_estado not in estados_validos:
            return Response({"status": f"Estado inválido. Debe ser uno de: {', '.join(estados_validos)}."}, status=status.HTTP_400_BAD_REQUEST)

        pedido.status = nuevo_estado
        pedido.save()

        # Sincronizar el estado del pago si existe
        if hasattr(pedido, 'pago'):
            pago = pedido.pago
            if nuevo_estado == 'PAYMENT_APPROVED':
                pago.status = 'APPROVED'
                pago.verified_by = request.user
                pago.verified_at = timezone.now()
                pago.save()
            elif nuevo_estado == 'CANCELLED':
                pago.status = 'REJECTED'
                pago.verified_by = request.user
                pago.verified_at = timezone.now()
                pago.save()
                
                # Devolución de stock al cancelar un pedido
                for item in pedido.items.all():
                    from apps.inventario.models import MovimientoInventario
                    MovimientoInventario.objects.create(
                        variant=item.variant,
                        movement_type='IN',
                        quantity=item.quantity,
                        reason=f"Devolución por cancelación de Pedido {pedido.id}",
                        user=request.user
                    )

        return Response(PedidoSerializer(pedido).data)
