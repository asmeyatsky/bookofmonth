from rest_framework import serializers
from .models import MonthlyBookModel

class MonthlyBookSerializer(serializers.ModelSerializer):
    class Meta:
        model = MonthlyBookModel
        fields = '__all__'
