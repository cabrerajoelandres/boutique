from rest_framework import viewsets
from .models import Pago
from .serializers import PagoSerializer
from apps.usuarios.permissions import IsAdminUser

class PagoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Pago.objects.all()
    serializer_class = PagoSerializer
    permission_classes = [IsAdminUser]
