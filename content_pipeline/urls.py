from django.urls import path, include
from rest_framework import routers
from .views import NewsEventViewSet

router = routers.DefaultRouter()
router.register(r'news-events', NewsEventViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
