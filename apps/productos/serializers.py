import json
import re

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
            raise serializers.ValidationError('The selected size is not valid.')
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

    def _extract_variantes_from_initial_data(self):
        variantes_by_index = {}
        pattern = re.compile(r'^variantes\[(\d+)\](\w+)$')

        for key in self.initial_data.keys():
            match = pattern.match(key)
            if not match:
                continue

            index = int(match.group(1))
            field_name = match.group(2)
            value = self.initial_data.get(key)

            if field_name == 'id' and value in (None, '', 'null'):
                continue
            if field_name == 'stock':
                value = int(value or 0)
            elif field_name == 'is_active':
                value = str(value).lower() == 'true'
            elif field_name == 'id':
                value = int(value)

            variantes_by_index.setdefault(index, {})[field_name] = value

        parsed_variantes = []
        for index in sorted(variantes_by_index.keys()):
            variant_payload = variantes_by_index[index]
            variant_serializer = VarianteProductoSerializer(data=variant_payload)
            variant_serializer.is_valid(raise_exception=True)
            parsed_variantes.append(variant_serializer.validated_data)

        return parsed_variantes

    def create(self, validated_data):
        imagenes_data = validated_data.pop('imagenes_adicionales', [])
        validated_data.pop('variantes', None)
        validated_data.pop('deleted_variants', None)
        variantes_data = self._extract_variantes_from_initial_data()

        producto = Producto.objects.create(**validated_data)

        for img_data in imagenes_data:
            ImagenProducto.objects.create(product=producto, **img_data)

        for var_data in variantes_data:
            VarianteProducto.objects.create(product=producto, **var_data)

        return producto

    def update(self, instance, validated_data):
        imagenes_data = validated_data.pop('imagenes_adicionales', None)
        validated_data.pop('variantes', None)
        deleted_variants_raw = validated_data.pop('deleted_variants', '[]')
        variantes_data = self._extract_variantes_from_initial_data()

        if deleted_variants_raw:
            try:
                json.loads(deleted_variants_raw)
            except json.JSONDecodeError:
                raise serializers.ValidationError({
                    'deleted_variants': 'Invalid deleted variants format.'
                })

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if imagenes_data is not None:
            instance.imagenes_adicionales.all().delete()
            for img_data in imagenes_data:
                ImagenProducto.objects.create(product=instance, **img_data)

        if variantes_data is not None:
            existing_variants_by_id = {v.id: v for v in instance.variantes.all()}
            existing_variants_by_sku = {v.sku_variant: v for v in instance.variantes.all()}
            keep_variants_ids = set()

            for var_data in variantes_data:
                variant_id = var_data.pop('id', None)
                color = var_data.get('color')
                size = var_data.get('size')

                suffix = f"-{color}"
                if size:
                    suffix += f"-{size}"
                sku_variant = f"{instance.sku}{suffix}".replace(' ', '')

                v_instance = None
                if variant_id:
                    v_instance = existing_variants_by_id.get(int(variant_id))
                if v_instance is None:
                    v_instance = existing_variants_by_sku.get(sku_variant)

                if v_instance:
                    v_instance.color = var_data.get('color', v_instance.color)
                    v_instance.size = var_data.get('size', v_instance.size)
                    v_instance.stock = var_data.get('stock', v_instance.stock)
                    if 'image' in var_data:
                        v_instance.image = var_data.get('image', v_instance.image)
                    v_instance.is_active = var_data.get('is_active', v_instance.is_active)
                    v_instance.save()
                    keep_variants_ids.add(v_instance.id)
                else:
                    new_var = VarianteProducto.objects.create(product=instance, **var_data)
                    keep_variants_ids.add(new_var.id)

            for v_instance in list(instance.variantes.all()):
                if v_instance.id not in keep_variants_ids:
                    try:
                        v_instance.delete()
                    except ProtectedError:
                        raise serializers.ValidationError({
                            'variantes': f'Cannot delete variant {v_instance.sku_variant} because it has associated orders.'
                        })

        return instance
