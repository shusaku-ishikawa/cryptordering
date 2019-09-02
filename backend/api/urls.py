from rest_framework import routers
from django.contrib import admin
from django.urls import path
from .views import *    

urlpatterns = [
    path('get-token/', CustomObtainAuthToken.as_view(), name = 'get-token'),
    path('assets/', AssetView.as_view(), name = 'assets'),
    path('ticker/', TickerView.as_view(), name = 'ticker'),
        
]

router = routers.SimpleRouter()
router.register('users', UserViewSet)
router.register('alerts', AlertViewSet)
urlpatterns += router.urls

