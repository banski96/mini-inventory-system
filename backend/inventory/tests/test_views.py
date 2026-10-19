
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from inventory.models import Category, Product


class InventoryAPITests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(
            username="inventory_tester",
            password="TestPassword123!",
        )
        self.client.force_authenticate(user=self.user)

        self.category = Category.objects.create(name="Electronics")
        self.other_category = Category.objects.create(name="Accessories")

        self.product = Product.objects.create(
            name="Mechanical Keyboard",
            price="49.99",
            stock=20,
            category=self.category,
        )

    def test_unauthenticated_user_cannot_list_products(self):
        self.client.force_authenticate(user=None)

        response = self.client.get(reverse("product-list"))

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_category_can_be_created(self):
        response = self.client.post(
            reverse("category-list"),
            {"name": "Office Supplies"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            Category.objects.filter(name="Office Supplies").exists()
        )

    def test_category_can_be_updated(self):
        response = self.client.patch(
            reverse("category-detail", args=[self.category.pk]),
            {"name": "Computer Equipment"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.category.refresh_from_db()
        self.assertEqual(self.category.name, "Computer Equipment")

    def test_category_can_be_deleted(self):
        response = self.client.delete(
            reverse("category-detail", args=[self.other_category.pk])
        )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            Category.objects.filter(pk=self.other_category.pk).exists()
        )

    def test_product_can_be_created(self):
        payload = {
            "name": "USB Mouse",
            "price": "25.50",
            "stock": 15,
            "category": self.category.pk,
            "is_active": True,
        }

        response = self.client.post(
            reverse("product-list"),
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Product.objects.filter(name="USB Mouse").exists())
        self.assertEqual(response.data["price"], "25.50")

    def test_product_can_be_updated(self):
        payload = {
            "name": "Wireless Keyboard",
            "price": "59.99",
            "stock": 12,
            "category": self.category.pk,
            "is_active": True,
        }

        response = self.client.put(
            reverse("product-detail", args=[self.product.pk]),
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.product.refresh_from_db()
        self.assertEqual(self.product.name, "Wireless Keyboard")
        self.assertEqual(self.product.stock, 12)

    def test_product_can_be_deleted(self):
        response = self.client.delete(
            reverse("product-detail", args=[self.product.pk])
        )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            Product.objects.filter(pk=self.product.pk).exists()
        )

    def test_product_search_filters_by_name(self):
        Product.objects.create(
            name="USB Mouse",
            price="25.50",
            stock=15,
            category=self.other_category,
        )

        response = self.client.get(
            reverse("product-list"),
            {"search": "Keyboard"},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        results = response.data["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["name"], "Mechanical Keyboard")

    def test_products_can_be_filtered_by_category(self):
        Product.objects.create(
            name="USB Mouse",
            price="25.50",
            stock=15,
            category=self.other_category,
        )

        response = self.client.get(
            reverse("product-list"),
            {"category": self.category.pk},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        results = response.data["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["name"], "Mechanical Keyboard")
        self.assertEqual(results[0]["category"], self.category.pk)
