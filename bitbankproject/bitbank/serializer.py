from rest_framework import serializers
from .models import *
import logging

class UserSerializer(serializers.ModelSerializer):

    use_alert = serializers.CharField(allow_null = True)
    notify_if_filled = serializers.CharField(allow_null = True)

    class Meta:
        model = User
        fields = ('pk', 'full_name', 'email', 'email_for_notice', 'api_key', 'api_secret_key', 'notify_if_filled', 'use_alert', 'date_joined')

        read_only_fields = ('pk', 'email', 'date_joined')

    def create(self, validated_data):
        print('create called')

    def update(self, instance, validated_data):
        logger = logging.getLogger('transaction_logger')
        print(validated_data)
        logger.info('update called')
        full_name = validated_data.pop("full_name")
        api_key = validated_data.pop("api_key")
        api_secret_key = validated_data.pop("api_secret_key")
        email_for_notice = validated_data.pop("email_for_notice")
        notify_if_filled = validated_data.pop('notify_if_filled')
        use_alert = validated_data.pop('use_alert')

        try:
            if full_name != None and full_name != "":
                logger.info('full name is::' + full_name) 
                instance.full_name = full_name
            if api_key != None and api_key != "":
                instance.api_key = api_key
            if api_secret_key != None and api_secret_key != "":
                instance.api_secret_key = api_secret_key
            if email_for_notice != None and email_for_notice != "":
                instance.email_for_notice = email_for_notice
            if notify_if_filled != None and notify_if_filled != "":
                instance.notify_if_filled = notify_if_filled
            if use_alert != None and use_alert != "":
                instance.use_alert = use_alert
            logger.info('full name = ' + instance.full_name)
            print('api_key = ' + instance.api_key)
         
            instance.save()
        except Exception as e:
            logger.info('error: ' + str(e.args))
        finally:
            return instance


class AlertSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Alert
        fields = ('pk', 'market', 'pair', 'threshold', 'over_or_under')
        read_only_fields = ('pk',)

    def create(self, validated_data):
        user = self.context['request'].user
        print(user)
        market = validated_data.pop('market')
        pair = validated_data.pop('pair')
        threshold = validated_data.pop('threshold')
        over_or_under = validated_data.pop('over_or_under')

        try:
            instance = Alert(user=user, market = market, pair=pair, threshold=threshold, over_or_under=over_or_under, is_active=True, alerted_at=None)
            instance.save()
        except Exception as e:
            traceback.print_exc()
        finally:
            return instance

class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ('pk', 'market', 'pair', 'side', 'order_type', 'price', 'price_for_stop', 'trail_width', 'trail_price', 'start_amount', 'remaining_amount', 'executed_amount', 'average_price', 'status', 'order_id', 'ordered_at', 'error_message', 'updated_at')
        read_only_fields = ('pk', 'status', 'remaining_amount', 'executed_amount', 'average_price', 'status', 'order_id', 'ordered_at', 'error_message', 'updated_at')
    
    

class RelationSerializer(serializers.ModelSerializer):
    # market = serializers.ReadOnlyField()
    order_1 = OrderSerializer(many = False, read_only = True)
    order_2 = OrderSerializer(many = False, read_only = True)
    order_3 = OrderSerializer(many = False, read_only = True)
    
    class Meta:
        model = Relation
        fields = ('pk', 'market', 'pair', 'special_order', 'order_1', 'order_2', 'order_3', 'placed_at', 'is_active')