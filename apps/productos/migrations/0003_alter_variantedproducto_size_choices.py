# Generated manually to align the database schema with the fixed size options.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('productos', '0002_producto_gender_alter_producto_sku'),
    ]

    operations = [
        migrations.AlterField(
            model_name='varianteproducto',
            name='size',
            field=models.CharField(
                blank=True,
                choices=[
                    ('XS', 'XS - Extra Small'),
                    ('S', 'S - Small'),
                    ('M', 'M - Medium'),
                    ('L', 'L - Large'),
                    ('XL', 'XL'),
                ],
                max_length=20,
                null=True,
            ),
        ),
    ]
