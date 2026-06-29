from rest_framework import serializers
from .models import Pago

class PagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pago
        fields = ['id', 'payment_method', 'amount', 'receipt_image', 'status', 'verified_at', 'created_at']
        read_only_fields = ['id', 'amount', 'status', 'verified_at', 'created_at']
