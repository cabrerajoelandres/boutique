from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InventarioViewSet

router = DefaultRouter()
router.register(r'', InventarioViewSet, basename='inventario')

urlpatterns = [
    path('', include(router.urls)),
]
