from rest_framework import serializers
from .models import *
import logging
from .coincheck.coincheck import CoinCheck
import python_bitbankcc
from .myexceptions import *

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
            instance.over_or_under = 'over' if validated_data['rate'] > float(last) else 'under' 
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
        instance = Order(**validated_data)
        instance.user = user
        if validated_data['order_type'] == Order.TYPE_TRAIL:
            try:
                ret = python_bitbankcc.public().get_ticker(validated_data['pair']) if validated_data['market'] == 'bitbank' else json.loads(CoinCheck('fake', 'fake').ticker.all())['last']
            except Exception:
                raise OrderFailedError('トレール注文時のレートの取得に失敗しました')
            else:
                try:
                    last_price = float(ret['last'])
                except ValueError:
                    last_price = 0
                else:
                    instance.trail_price = last_price
                
        instance.save()

        if instance.order_type in {Order.TYPE_MARKET, Order.TYPE_LIMIT} and instance.status == Order.STATUS_READY_TO_ORDER:       
            try:
                order_succeeded = instance.place()
            except OrderFailedError as e:
                raise
            else:
                return instance
        else:
            return instance

    def update(self, instance, validated_data):
        ''' 親のrelationをロック状態とする '''
        attr_name = instance.myposition
        parent = getattr(instance, attr_name)
        parent.is_locked = True
        parent.save()
        
        ''' 既に発注済みの場合は元の注文をキャンセル '''
        try:
            instance.cancel()
        except Exception:
            # 元キャンセル失敗の場合はそのまま
            parent.is_locked = False
            parent.save()
            raise
        else:
            try:
                new_instance = self.create(validated_data)
            # 新注文失敗時は特殊注文を無効化する
            except OrderFailedError as e:
                order_type = parent.special_order
                
                if order_type == 'SINGLE':
                    parent.is_active = False
                    setattr(parent, attr_name, None)
                    parent.save()
                elif order_type == 'IFD':
                    other_order = parent.order_2 if attr_name == 'order_1' else parent.order_1
                    # 他方をキャンセル
                    try:
                        other_order.cancel()
                    except Exception:
                        pass
                    finally:
                        parent.order_1 = None
                        parent.order_2 = None
                        parent.save()
                elif order_type == 'OCO':
                    other_order = parent.order_2 if attr_name == 'order_3' else parent.order_3
                    # 他方をキャンセル
                    try:
                        other_order.cancel()
                    except Exception:
                        pass
                    finally:
                        parent.order_2= None
                        parent.order_3 = None
                        parent.save()
                elif order_type == 'IFDOCO':
                    if attr_name == 'order_1':
                        try:
                            parent.order_2.cancel()
                        except Exception:
                            pass
                        finally:
                            parent.order_2 = None

                        try:
                            parent.order_3.cancel()
                        except Exception:
                            pass
                        finally:
                            parent.order_3 = None
                        parent.save()
                    elif attr_name == 'order_2':
                        try:
                            parent.order_1.cancel()
                        except Exception:
                            pass
                        finally:
                            parent.order_1 = None

                        try:
                            parent.order_3.cancel()
                        except Exception:
                            pass
                        finally:
                            parent.order_3 = None
                        parent.save()
                    elif attr_name == 'order_3':
                        try:
                            parent.order_1.cancel()
                        except Exception:
                            pass
                        finally:
                            parent.order_1 = None

                        try:
                            parent.order_2.cancel()
                        except Exception:
                            pass
                        finally:
                            parent.order_2 = None
                        parent.save()
                parent.is_locked = False
                parent.save()
                raise   
            else:
                # 新しい注文オブジェクトをセット
                setattr(parent, attr_name, new_instance)
                parent.is_locked = False
                parent.save()
                print(new_instance.status)
                return new_instance
        
    def validate(self, data):
        # coincheckの新規注文の場合は0.005以上の取引であること
        if 'order_id' not in data and data['market'] == 'coincheck' and data['start_amount'] < 0.005:
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
    
