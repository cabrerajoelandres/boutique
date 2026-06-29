from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CarritoViewSet

router = DefaultRouter()
router.register(r'', CarritoViewSet, basename='carrito')

# Las rutas serán:
# GET /api/cart/ -> list (ver carrito)
# POST /api/cart/items/ -> add_item
# PUT /api/cart/<item_id>/items-update/ -> update_item
# DELETE /api/cart/<item_id>/items-delete/ -> delete_item

urlpatterns = [
    path('', include(router.urls)),
]
