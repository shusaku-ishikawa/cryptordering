from core.admin import admin_site
from django.urls import path
from django.conf.urls import include

app_name = 'api'
urlpatterns = [
    path('v3/api/', include('api.urls')),
    path('v3/admin/', admin_site.urls),
]
