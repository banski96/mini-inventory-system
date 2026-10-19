from rest_framework import viewsets
from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by("id")
    serializer_class = ProductSerializer

    filter_backends = [SearchFilter, DjangoFilterBackend]
    search_fields = ["name"]
    filterset_fields = ["category"]