from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from .models import PerfilUsuario
from apps.carrito.models import Carrito

Usuario = get_user_model()

class PerfilUsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerfilUsuario
        fields = [
            'phone',
            'backup_phone',
            'province',
            'address_line1',
            'address_line2',
            'city',
            'state',
            'postal_code',
            'country',
        ]
        extra_kwargs = {
            'phone': {'required': False, 'allow_blank': True, 'allow_null': True},
            'backup_phone': {'required': False, 'allow_blank': True, 'allow_null': True},
            'province': {'required': False, 'allow_blank': True, 'allow_null': True},
            'address_line1': {'required': False, 'allow_blank': True, 'allow_null': True},
            'address_line2': {'required': False, 'allow_blank': True, 'allow_null': True},
            'city': {'required': False, 'allow_blank': True, 'allow_null': True},
            'state': {'required': False, 'allow_blank': True, 'allow_null': True},
            'postal_code': {'required': False, 'allow_blank': True, 'allow_null': True},
            'country': {'required': False},
        }

class UsuarioSerializer(serializers.ModelSerializer):
    perfil = PerfilUsuarioSerializer()

    class Meta:
        model = Usuario
        fields = ['id', 'email', 'first_name', 'last_name', 'role', 'perfil']
        read_only_fields = ['id', 'email', 'role']

    def update(self, instance, validated_data):
        perfil_data = validated_data.pop('perfil', None)
        
        # Actualizar campos del usuario
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.save()

        # Actualizar campos del perfil
        if perfil_data is not None:
            perfil, _ = PerfilUsuario.objects.get_or_create(user=instance)
            for attr, value in perfil_data.items():
                setattr(perfil, attr, value)
            perfil.save()

        return instance

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = Usuario
        fields = ['email', 'password', 'password_confirm', 'first_name', 'last_name']

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({"password": "Las contraseñas no coinciden."})
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        user = Usuario.objects.create_user(
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        user.set_password(password)
        user.save()
        
        # Crear perfil y carrito automáticamente para el usuario
        PerfilUsuario.objects.create(user=user)
        Carrito.objects.create(user=user)
        
        return user

class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
    new_password_confirm = serializers.CharField(required=True)

    def validate(self, data):
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError({"new_password": "Las contraseñas no coinciden."})
        return data


class LoginSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        PerfilUsuario.objects.get_or_create(user=self.user)
        data["user"] = UsuarioSerializer(self.user).data
        return data
