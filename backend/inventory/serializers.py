from rest_framework import serializers
from decimal import Decimal
from .models import Category, Product


class CategorySerializer(serializers.ModelSerializer):
    name = serializers.CharField(
        max_length=100,
        trim_whitespace=True,
    )

    class Meta:
        model = Category
        fields = ["id", "name"]
        read_only_fields = ["id"]

    def validate_name(self, value):
        queryset = Category.objects.filter(name__iexact=value.strip())

        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                "A category with this name already exists."
            )

        return value.strip()


class ProductSerializer(serializers.ModelSerializer):
    price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal("0.01"),
    )
    stock = serializers.IntegerField(min_value=0)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "price",
            "stock",
            "category",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]