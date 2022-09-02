from django.urls import path

from . import views

urlpatterns = [
    path('demo1/', views.index1, name='index1'),
    path('', views.index2, name='index2'),
]