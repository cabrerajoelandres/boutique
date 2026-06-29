"""
URL configuration for backend project.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Boutique APIs
    path('api/auth/', include('apps.usuarios.urls')),
    path('api/categories/', include('apps.categorias.urls')),
    path('api/products/', include('apps.productos.urls')),
    path('api/cart/', include('apps.carrito.urls')),
    path('api/orders/', include('apps.pedidos.urls')),
    path('api/payments/', include('apps.pagos.urls')),
    path('api/inventory/', include('apps.inventario.urls')),
    path('api/dashboard/', include('apps.dashboard.urls')),
]

# Servir archivos estáticos y media en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Rutear cualquier otra url hacia el index.html de React (SPA Catch-all)
urlpatterns += [
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html'), name='react_frontend'),
]

