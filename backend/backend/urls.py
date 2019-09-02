from core.admin import admin_site
from django.urls import path
from django.conf.urls import include

app_name = 'api'
urlpatterns = [
    path('api/', include('api.urls')),
    path('admin/', admin_site.urls),
]
