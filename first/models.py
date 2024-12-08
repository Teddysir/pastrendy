from django.db import models

class Inventory(models.Model):
    name = models.CharField(max_length=100)  # 제품 이름
    quantity = models.PositiveIntegerField()  # 수량
    price = models.DecimalField(max_digits=10, decimal_places=2)  # 가격

    def __str__(self):
        return self.name
