# Generated by Django 2.1.5 on 2019-03-20 04:05

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('bitbank', '0002_auto_20190307_1740'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='alert',
            options={'verbose_name': '通知設定', 'verbose_name_plural': '通知設定'},
        ),
        migrations.AlterModelOptions(
            name='bitbankorder',
            options={'verbose_name': '取引履歴', 'verbose_name_plural': '取引履歴'},
        ),
        migrations.AlterModelOptions(
            name='inquiry',
            options={'verbose_name': '問い合せ', 'verbose_name_plural': '問い合せ'},
        ),
        migrations.AlterModelOptions(
            name='orderrelation',
            options={'verbose_name': '発注一覧', 'verbose_name_plural': '発注一覧'},
        ),
        migrations.AlterModelOptions(
            name='user',
            options={'verbose_name': '利用者', 'verbose_name_plural': '利用者'},
        ),
        migrations.AddField(
            model_name='bitbankorder',
            name='market',
            field=models.CharField(default='bitbank', max_length=50, verbose_name='取引所'),
        ),
        migrations.AlterField(
            model_name='alert',
            name='threshold',
            field=models.FloatField(verbose_name='通知レート'),
        ),
        migrations.AlterField(
            model_name='bitbankorder',
            name='side',
            field=models.CharField(max_length=50, verbose_name='売/買'),
        ),
        migrations.AlterField(
            model_name='bitbankorder',
            name='status',
            field=models.CharField(max_length=50, null=True, verbose_name='ステータス'),
        ),
        migrations.AlterField(
            model_name='bitbankorder',
            name='user',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL, verbose_name='利用者'),
        ),
        migrations.AlterField(
            model_name='inquiry',
            name='date_initiated',
            field=models.DateTimeField(auto_now_add=True, verbose_name='問い合せ日時'),
        ),
        migrations.AlterField(
            model_name='orderrelation',
            name='is_active',
            field=models.BooleanField(default=True, verbose_name='有効'),
        ),
    ]