# Generated by Django 2.1.5 on 2019-03-28 08:09

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bitbank', '0018_auto_20190328_1502'),
    ]

    operations = [
        migrations.CreateModel(
            name='test',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('bank', models.CharField(default='xxx銀行', max_length=20, verbose_name='金融機関名')),
            ],
            options={
                'verbose_name': 'test',
                'verbose_name_plural': 'test',
            },
        ),
    ]
