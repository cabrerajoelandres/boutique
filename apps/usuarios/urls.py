from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .serializers import LoginSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from .views import RegisterView, ProfileView, PasswordChangeView, PasswordRecoverView, ClientListView


class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', LoginView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', ProfileView.as_view(), name='auth_profile'),
    path('password/change/', PasswordChangeView.as_view(), name='auth_password_change'),
    path('password/recover/', PasswordRecoverView.as_view(), name='auth_password_recover'),
    path('clients/', ClientListView.as_view(), name='admin_clients_list'),
]
