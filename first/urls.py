from django.urls import path
from . import views

urlpatterns = [
    path('list/', views.inventory_list, name='inventory_list'),
    path('list/add/', views.inventory_add, name='inventory_add'),
    path('list/edit/<int:pk>/', views.inventory_edit, name='inventory_edit'),
    path('list/delete/<int:pk>/', views.inventory_delete, name='inventory_delete'),
    path('manual/', views.product_manual, name='product_manual'),
    path('manual/checkout/', views.product_manual_checkout, name='product_manual_checkout'),
    path('auto/', views.product_auto, name='product_auto'),
]

