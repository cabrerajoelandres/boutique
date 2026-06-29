import json

from django.db.models import ProtectedError
from rest_framework import serializers
from .models import Producto, ImagenProducto, VarianteProducto
from apps.categorias.serializers import CategoriaSerializer
from apps.categorias.models import Categoria

class ImagenProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImagenProducto
        fields = ['id', 'image']

class ProductShortSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = ['id', 'name', 'price', 'offer_price', 'image_principal']

class VarianteProductoSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    product = ProductShortSerializer(read_only=True)

    class Meta:
        model = VarianteProducto
        fields = ['id', 'color', 'size', 'image', 'stock', 'sku_variant', 'is_active', 'product']
        read_only_fields = ['sku_variant']

    def validate_size(self, value):
        if value in (None, ''):
            return value
        allowed_sizes = {choice[0] for choice in VarianteProducto.SIZE_CHOICES}
        if value not in allowed_sizes:
            raise serializers.ValidationError('La talla seleccionada no es válida.')
        return value

class ProductoSerializer(serializers.ModelSerializer):
    imagenes_adicionales = ImagenProductoSerializer(many=True, required=False)
    variantes = VarianteProductoSerializer(many=True, required=False)
    deleted_variants = serializers.CharField(write_only=True, required=False, allow_blank=True)
    category_detail = CategoriaSerializer(source='category', read_only=True)
    category = serializers.PrimaryKeyRelatedField(queryset=Categoria.objects.all())

    class Meta:
        model = Producto
        fields = [
            'id', 'sku', 'name', 'slug', 'description', 'category', 'category_detail',
            'price', 'offer_price', 'brand', 'gender', 'image_principal', 'is_active', 
            'min_stock_alert', 'imagenes_adicionales', 'variantes', 'deleted_variants', 'created_at'
        ]
        read_only_fields = ['id', 'sku', 'slug', 'created_at']

    def create(self, validated_data):
        imagenes_data = validated_data.pop('imagenes_adicionales', [])
        variantes_data = validated_data.pop('variantes', [])
        validated_data.pop('deleted_variants', None)
        
        producto = Producto.objects.create(**validated_data)
        
        for img_data in imagenes_data:
            ImagenProducto.objects.create(product=producto, **img_data)
            
        for var_data in variantes_data:
            VarianteProducto.objects.create(product=producto, **var_data)
            
        return producto

    def update(self, instance, validated_data):
        imagenes_data = validated_data.pop('imagenes_adicionales', None)
        variantes_data = validated_data.pop('variantes', None)
        deleted_variants_raw = validated_data.pop('deleted_variants', '[]')
        deleted_variants = []
        if deleted_variants_raw:
            try:
                deleted_variants = json.loads(deleted_variants_raw)
            except json.JSONDecodeError:
                raise serializers.ValidationError({
                    'deleted_variants': 'Formato inválido para variantes eliminadas.'
                })
        
        # Actualizar campos directos del producto
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Actualizar imágenes
        if imagenes_data is not None:
            instance.imagenes_adicionales.all().delete()
            for img_data in imagenes_data:
                ImagenProducto.objects.create(product=instance, **img_data)
                
        # Actualizar variantes de forma segura
        if variantes_data is not None:
            existing_variants_by_id = {v.id: v for v in instance.variantes.all()}
            existing_variants_by_sku = {v.sku_variant: v for v in instance.variantes.all()}
            keep_variants_ids = set()
            deleted_variant_ids = set()

            for variant_id in deleted_variants:
                if variant_id in existing_variants_by_id:
                    deleted_variant_ids.add(int(variant_id))
            
            for variant_id in deleted_variant_ids:
                variant = existing_variants_by_id[variant_id]
                try:
                    variant.delete()
                except ProtectedError:
                    raise serializers.ValidationError({
                        'deleted_variants': f'No se puede eliminar la variante {variant.sku_variant} porque tiene pedidos asociados.'
                    })
            
            for var_data in variantes_data:
                variant_id = var_data.pop('id', None)
                color = var_data.get('color')
                size = var_data.get('size')
                
                # Generar el SKU esperado para emparejar
                suffix = f"-{color}"
                if size:
                    suffix += f"-{size}"
                sku_variant = f"{instance.sku}{suffix}".replace(" ", "")
                
                v_instance = None
                if variant_id:
                    v_instance = existing_variants_by_id.get(int(variant_id))
                if v_instance is None:
                    v_instance = existing_variants_by_sku.get(sku_variant)

                if v_instance:
                    # Actualizar variante existente
                    v_instance.color = var_data.get('color', v_instance.color)
                    v_instance.size = var_data.get('size', v_instance.size)
                    v_instance.stock = var_data.get('stock', v_instance.stock)
                    if 'image' in var_data:
                        v_instance.image = var_data.get('image', v_instance.image)
                    v_instance.is_active = var_data.get('is_active', v_instance.is_active)
                    v_instance.save()
                    keep_variants_ids.add(v_instance.id)
                else:
                    # Crear nueva variante
                    new_var = VarianteProducto.objects.create(product=instance, **var_data)
                    keep_variants_ids.add(new_var.id)
            
            # Las variantes no enviadas se conservan activas, salvo que se pidan borrar explícitamente.
            for v_instance in instance.variantes.all():
                if v_instance.id not in keep_variants_ids and v_instance.id not in deleted_variant_ids:
                    v_instance.save()
                    
        return instance
