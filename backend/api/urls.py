from rest_framework import routers
from django.contrib import admin
from django.urls import path
from .views import *    

app_name = 'api'
urlpatterns = [
    path('signup/', SignUpView.as_view(), name = 'signup'),
    path('password-reset/', PasswordResetView.as_view(), name = 'password-reset'),
    path('password-change/', PasswordChangeView.as_view(), name = 'password-change'),
    path('get-token/', CustomObtainAuthToken.as_view(), name = 'get-token'),
    path('assets/', AssetView.as_view(), name = 'assets'),
    path('ticker/', TickerView.as_view(), name = 'ticker'), 
    path('contact/', ContactView.as_view(), name = 'contact'),
]

router = routers.SimpleRouter()
router.register('users', UserViewSet)
router.register('alerts', AlertViewSet)
router.register('history', OrderViewSet)
router.register('relations', RelationViewSet)
router.register('orders', OrderViewSet)
urlpatterns += router.urls

