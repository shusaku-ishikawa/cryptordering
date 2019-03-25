from rest_framework import serializers
from .models import *
import logging
from .coincheck.coincheck import CoinCheck
import python_bitbankcc


class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = ('pk', 'full_name', 'email', 'email_for_notice', 'bb_api_key', 'bb_api_secret_key','cc_api_key', 'cc_api_secret_key', 'notify_if_filled', 'use_alert', 'date_joined')

        read_only_fields = ('pk', 'email', 'date_joined')

    def create(self, validated_data):
        print('create called')

    def update(self, instance, validated_data):
        logger = logging.getLogger('transaction_logger')
        print('here is update validated data')
        print(validated_data)
        logger.info('update called')
        User.objects.filter(pk = instance.pk).update(**validated_data)
        return instance


class AlertSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Alert
        fields = ('pk', 'market', 'pair', 'threshold', 'over_or_under')
        read_only_fields = ('pk',)

    def create(self, validated_data):
        user = self.context['request'].user

        try:
            instance = Alert(**validated_data)
            instance.user = user
            instance.is_active = True
            instance.save()
        except Exception as e:
            print(str(e.args))
        finally:
            return instance

class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ('pk', 'market', 'pair', 'side', 'order_type', 'price', 'price_for_stop', 'trail_width', 'trail_price', 'start_amount', 'remaining_amount', 'executed_amount', 'average_price', 'status', 'order_id', 'ordered_at', 'error_message', 'updated_at')
        read_only_fields = ('pk', 'status', 'trail_price', 'remaining_amount', 'executed_amount', 'average_price', 'status', 'order_id', 'ordered_at', 'error_message', 'updated_at')
    
    def create(self, validated_data):
        user = self.context['request'].user
        is_ready = self.context['is_ready']
        try:
            instance = Order(**validated_data)
            instance.user = user
            instance.status = Order.STATUS_READY_TO_ORDER if is_ready else Order.STATUS_WAIT_OTHER_ORDER_TO_FILL
            
            if validated_data['order_type'] == Order.TYPE_TRAIL:
                try:
                    ret = python_bitbankcc.public().get_ticker(validated_data['pair']) if validated_data['market'] == 'bitbnak' else CoinCheck('fake', 'fake').ticker.all()['last']
                    instance.trail_price = float(ret['last'])
                except Exception:
                    instance.trail_price = 0

            instance.save()

            if instance.order_type in {Order.TYPE_MARKET, Order.TYPE_LIMIT} and is_ready:       
                instance.place()

            return instance
        except Exception as e:
            print(str(e.args))
            



class RelationSerializer(serializers.ModelSerializer):
    order_1 = OrderSerializer(many = False, required = False)
    order_2 = OrderSerializer(many = False, required = False)
    order_3 = OrderSerializer(many = False, required = False)
    
    class Meta:
        model = Relation
        fields = ('pk', 'market', 'pair', 'special_order', 'order_1', 'order_2', 'order_3', 'placed_at', 'is_active')
        read_only_fields = ('pk', 'placed_at', 'is_active')
    
