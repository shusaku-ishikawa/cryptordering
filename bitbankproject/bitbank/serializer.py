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


    def update(self, instance, validated_data):
        User.objects.filter(pk = instance.pk).update(**validated_data)
        return instance


class AlertSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Alert
        fields = ('pk', 'market', 'pair', 'rate', 'over_or_under')
        read_only_fields = ('pk', 'over_or_under')

    def create(self, validated_data):
        user = self.context['user']

        try:
            instance = Alert(**validated_data)
            last = python_bitbankcc.public().get_ticker(validated_data['pair'])['last'] if validated_data['market'] == 'bitbank' else json.loads(CoinCheck('fake', 'fake').ticker.all())['last']
            instance.over_or_under = 'over' if validated_data['rate'] <= float(last) else 'under' 
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
        read_only_fields = ('pk', 'trail_price', 'error_message', 'updated_at')
    
    def create(self, validated_data):
        user = self.context['user']
       
        try:
            instance = Order(**validated_data)
            instance.user = user
            
            if validated_data['order_type'] == Order.TYPE_TRAIL:
                try:
                    ret = python_bitbankcc.public().get_ticker(validated_data['pair']) if validated_data['market'] == 'bitbank' else json.loads(CoinCheck('fake', 'fake').ticker.all())['last']
                    instance.trail_price = float(ret['last'])
                except Exception:
                    instance.trail_price = 0

            instance.save()

            if instance.order_type in {Order.TYPE_MARKET, Order.TYPE_LIMIT} and instance.status == Order.STATUS_READY_TO_ORDER:       
                instance.place()

            return instance
        except Exception as e:
            print('serializer ' + str(e.args))
    
    def validate(self, data):
        # coincheckの場合は0.005以上の取引であること
        if data['market'] == 'coincheck' and data['start_amount'] < 0.005:
            raise serializers.ValidationError(str(data['start_amount']) + ":coincheckの最小取引量を下回っております")
        return data
   



class RelationSerializer(serializers.ModelSerializer):
    order_1 = OrderSerializer(many = False, required = False)
    order_2 = OrderSerializer(many = False, required = False)
    order_3 = OrderSerializer(many = False, required = False)
    
    class Meta:
        model = Relation
        fields = ('pk', 'market', 'pair', 'special_order', 'order_1', 'order_2', 'order_3', 'placed_at', 'is_active')
        read_only_fields = ('pk', 'placed_at', 'is_active')
    
