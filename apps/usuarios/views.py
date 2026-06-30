from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, UsuarioSerializer, PasswordChangeSerializer
from .models import PerfilUsuario

Usuario = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = Usuario.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UsuarioSerializer

    def get_object(self):
        PerfilUsuario.objects.get_or_create(user=self.request.user)
        return self.request.user

class PasswordChangeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.validated_data['old_password']):
                return Response({"old_password": "La contraseña actual es incorrecta."}, status=status.HTTP_400_BAD_REQUEST)
            
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({"detail": "Contraseña actualizada con éxito."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PasswordRecoverView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"email": "El email es obligatorio."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = Usuario.objects.get(email=email)
            # Simulación de envío de correo en consola de desarrollo
            print(f"\n==================================================")
            print(f"--- SIMULACIÓN DE RECUPERACIÓN DE CONTRASEÑA ---")
            print(f"Enviar correo a: {email}")
            print(f"Link: http://localhost:5173/reset-password?email={email}&token=mock-token-xyz")
            print(f"==================================================\n")
            return Response({"detail": "Se ha enviado un correo electrónico para restablecer su contraseña."}, status=status.HTTP_200_OK)
        except Usuario.DoesNotExist:
            # Retornamos el mismo mensaje para evitar enumeración de cuentas
            return Response({"detail": "Se ha enviado un correo electrónico para restablecer su contraseña."}, status=status.HTTP_200_OK)

from .permissions import IsAdminUser

class ClientListView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = UsuarioSerializer
    queryset = Usuario.objects.filter(role='Client')
