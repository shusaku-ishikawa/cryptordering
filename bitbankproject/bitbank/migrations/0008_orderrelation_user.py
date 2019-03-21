# Generated by Django 2.1.5 on 2019-03-21 10:34

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('bitbank', '0007_remove_orderrelation_user'),
    ]

    operations = [
        migrations.AddField(
            model_name='orderrelation',
            name='user',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
            preserve_default=False,
        ),
    ]