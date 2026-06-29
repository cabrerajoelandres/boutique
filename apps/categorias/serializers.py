from rest_framework import serializers
from .models import Categoria

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id', 'name', 'slug', 'image', 'is_active', 'created_at']
        read_only_fields = ['id', 'slug', 'created_at']
