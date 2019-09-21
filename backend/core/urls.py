from rest_framework import routers
from django.contrib import admin
from django.urls import path
from .views import *    

app_name = 'core'
urlpatterns = [
    path('signupcomplete/<token>', SignUpCompleteView.as_view(), name = 'signupcomplete'),
]

