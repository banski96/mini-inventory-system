from django.test import TestCase

from inventory.models import Category
from inventory.serializers import CategorySerializer, ProductSerializer


class CategorySerializerTests(TestCase):
    def test_rejects_duplicate_category_name(self):
        Category.objects.create(name="Electronics")

        serializer = CategorySerializer(
            data={"name": "Electronics"}
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("name", serializer.errors)


class ProductSerializerTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Electronics")

    def valid_payload(self):
        return {
            "name": "Keyboard",
            "price": "25.00",
            "stock": 10,
            "category": self.category.pk,
            "is_active": True,
        }

    def test_accepts_valid_product(self):
        serializer = ProductSerializer(data=self.valid_payload())

        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_rejects_zero_price(self):
        data = self.valid_payload()
        data["price"] = "0.00"

        serializer = ProductSerializer(data=data)

        self.assertFalse(serializer.is_valid())
        self.assertIn("price", serializer.errors)

    def test_rejects_negative_stock(self):
        data = self.valid_payload()
        data["stock"] = -1

        serializer = ProductSerializer(data=data)

        self.assertFalse(serializer.is_valid())
        self.assertIn("stock", serializer.errors)

    def test_accepts_zero_stock(self):
        data = self.valid_payload()
        data["stock"] = 0

        serializer = ProductSerializer(data=data)

        self.assertTrue(serializer.is_valid(), serializer.errors)