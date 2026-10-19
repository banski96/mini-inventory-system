
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from inventory.models import Category, Product


SEED_DATA = {
    "Electronics": [
        ("Mechanical Keyboard", "49.99", 20),
        ("Wireless Mouse", "25.50", 35),
        ("USB-C Hub", "39.99", 18),
        ("27-inch Monitor", "229.00", 8),
        ("Webcam", "59.90", 14),
        ("Bluetooth Headphones", "79.99", 22),
    ],
    "Office Supplies": [
        ("Notebook", "3.50", 100),
        ("Ballpoint Pens Pack", "5.99", 60),
        ("Desk Organizer", "14.50", 17),
        ("A4 Paper Ream", "6.25", 45),
        ("Sticky Notes Pack", "2.99", 80),
        ("Whiteboard Markers", "7.50", 30),
    ],
    "Furniture": [
        ("Ergonomic Office Chair", "189.99", 7),
        ("Standing Desk", "349.00", 4),
        ("Monitor Stand", "29.95", 16),
        ("Filing Cabinet", "99.00", 5),
        ("Desk Lamp", "24.99", 20),
        ("Bookshelf", "119.00", 3),
    ],
    "Accessories": [
        ("Laptop Sleeve", "18.99", 25),
        ("HDMI Cable", "8.50", 50),
        ("Ethernet Cable", "6.99", 40),
        ("Laptop Stand", "32.00", 12),
        ("Surge Protector", "21.50", 19),
        ("Cable Management Clips", "4.99", 65),
    ],
}


class Command(BaseCommand):
    help = "Seed sample inventory categories and products."

    @transaction.atomic
    def handle(self, *args, **options):
        created_categories = 0
        created_products = 0
        updated_products = 0

        for category_name, products in SEED_DATA.items():
            category, category_created = Category.objects.get_or_create(
                name=category_name
            )

            if category_created:
                created_categories += 1

            for name, price, stock in products:
                _, product_created = Product.objects.update_or_create(
                    name=name,
                    defaults={
                        "price": Decimal(price),
                        "stock": stock,
                        "category": category,
                        "is_active": True,
                    },
                )

                if product_created:
                    created_products += 1
                else:
                    updated_products += 1

        total_products = sum(len(products) for products in SEED_DATA.values())

        self.stdout.write(
            self.style.SUCCESS(
                f"Seed complete: {created_categories} categories created, "
                f"{created_products} products created, "
                f"{updated_products} products updated. "
                f"{total_products} seed products defined."
            )
        )
