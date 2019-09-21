from core.admin import admin_site
from django.urls import path
from django.conf.urls import include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('api/', include('api.urls')),
    path('core/', include('core.urls')),
    path('admin/', admin_site.urls),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

