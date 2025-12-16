from rest_framework import serializers
from .models import NewsEventModel

class NewsEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsEventModel
        fields = '__all__'
