from django.urls import path, include
from rest_framework import routers
from .views import MonthlyBookViewSet

router = routers.DefaultRouter()
router.register(r'monthly-books', MonthlyBookViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
