from rest_framework import serializers
from .models import *




class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('pk', 'full_name', 'email', 'email_for_notice', 'api_key', 'api_secret_key', 'notify_if_filled', 'use_alert', 'date_joined')

class AlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alert
        fields = ('pk', 'market', 'pair', 'threshold')


class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ('pk','pair', 'side', 'order_type', 'price', 'price_for_stop', 'start_amount', 'remaining_amount', 'executed_amount', 'average_price', 'status', 'order_id', 'ordered_at', 'error_message', 'updated_at')

class RelationSerializer(serializers.ModelSerializer):
    order_1 = OrderSerializer(many = False, read_only = True)
    order_2 = OrderSerializer(many = False, read_only = True)
    order_3 = OrderSerializer(many = False, read_only = True)
    
    class Meta:
        model = Relation
        fields = ('pk', 'market', 'pair', 'special_order', 'order_1', 'order_2', 'order_3', 'placed_at', 'is_active')