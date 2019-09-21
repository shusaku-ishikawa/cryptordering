from rest_framework import serializers
from rest_framework.serializers import ValidationError
from core.models import *
import logging
from core.myexception import *
import ccxt
from core.enums import *
from django.core.signing import BadSignature, SignatureExpired, dumps, loads
from django.contrib.auth import password_validation

class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = ('id', 'full_name', 'email', 'email_for_notice', 'bb_api_key', 'bb_api_secret_key','cc_api_key', 'cc_api_secret_key', 'notify_if_filled', 'use_alert', 'date_joined', 'remaining_days','password')
        read_only_fields = ('id', 'date_joined')
        write_only_fields = ('password',)
    
    def create(self, validated_data):
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        validated_data['is_active'] = False
        user = User.objects._create_user(email, password, **validated_data)
        return user

class PasswordResetSerializer(serializers.Serializer):
    new_password_1 = serializers.CharField(required = True)
    new_password_2 = serializers.CharField(required = True)
    token = serializers.CharField(required = True)
    def validate_new_password_1(self, value):
        password_validation.validate_password(value)
        return value
    
    def validate_token(self, value):
        """
        Check that the blog post is about Django.
        """
        try:
            loads(value, max_age=60*10)
        except Exception:
            raise serializers.ValidationError('トークンが不正です')
        else:
            return value
    def validate(self, data):
        if data['new_password_1'] != data['new_password_2']:
            raise serializers.ValidationError('パスワードが一致しません')
        return data
    def save(self):
        user_pk = loads(self.validated_data['token'], max_age=60*10)
        user = User.objects.get(id = user_pk)
        user.set_password(self.validated_data['new_password_1'])
        return user
class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField()
    new_password_1 = serializers.CharField()
    new_password_2 = serializers.CharField()

    def validate_new_password_1(self, value):
        password_validation.validate_password(value)
        return value
    def validate(self, data):
        if data['new_password_1'] != data['new_password_2']:
            raise serializers.ValidationError({ 'new_password_1': 'パスワードが一致しません'})
        return data

class AlertSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Alert
        fields = ('id', 'market', 'symbol', 'rate', 'over_or_under', 'comment')
        read_only_fields = ('id', 'over_or_under')

    def create(self, validated_data):
        user = self.context['user']
        market = validated_data['market']
        instance = Alert(**validated_data)
        
        client_class = getattr(ccxt, market)
        client = client_class()

        try:
            ticker = client.fetch_ticker(validated_data['symbol'])
        except Exception:
            last = 0
        else:
            last = ticker['last']
           
        instance.over_or_under = 'over' if validated_data['rate'] > last else 'under' 
        instance.user = user
        instance.is_active = True
        instance.save()
        return instance

class InquirySerializer(serializers.ModelSerializer):
    class Meta:
        model = Inquiry
        fields = ('id', 'user', 'subject', 'body', 'email_for_reply', 'attachment_1', 'attachment_2', 'attachment_3')
        read_only_fields = ('id', )


class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ('auto_id', 'user', 'market', 'symbol', 'side', 'type', 'price', 'stop_price', 'trail_width', 'trail_price', 'amount', 'remaining', 'filled', 'average', 'status', 'id', 'timestamp', 'error_message', 'updated_at')
        read_only_fields = ('updated_at',)
    
    def save(self, **kwargs):
        assert not hasattr(self, 'save_object'), (
            'Serializer `%s.%s` has old-style version 2 `.save_object()` '
            'that is no longer compatible with REST framework 3. '
            'Use the new-style `.create()` and `.update()` methods instead.' %
            (self.__class__.__module__, self.__class__.__name__)
        )

        assert hasattr(self, '_errors'), (
            'You must call `.is_valid()` before calling `.save()`.'
        )

        assert not self.errors, (
            'You cannot call `.save()` on a serializer with invalid data.'
        )

        # Guard against incorrect use of `serializer.save(commit=False)`
        assert 'commit' not in kwargs, (
            "'commit' is not a valid keyword argument to the 'save()' method. "
            "If you need to access data before committing to the database then "
            "inspect 'serializer.validated_data' instead. "
            "You can also pass additional keyword arguments to 'save()' if you "
            "need to set extra attributes on the saved model instance. "
            "For example: 'serializer.save(owner=request.user)'.'"
        )

        assert not hasattr(self, '_data'), (
            "You cannot call `.save()` after accessing `serializer.data`."
            "If you need to access data before committing to the database then "
            "inspect 'serializer.validated_data' instead. "
        )

        validated_data = dict(
            list(self.validated_data.items()) +
            list(kwargs.items())
        )

        if self.instance is not None:
            self.instance = self.update(self.instance, validated_data)
        else:
            self.instance = self.create(validated_data)
            assert self.instance is not None, (
                '`create()` did not return an object instance.'
            )

        return self.instance

    def update(self, instance, validated_data):
        ''' 親のrelationをロック状態とする '''
        position = instance.myposition
        if position == 'new_order':
            attr_name = 'order_1'
        elif position == 'settle_order_1':
            attr_name = 'order_2'
        elif position == 'settle_order_2':
            attr_name = 'order_3'
            
        # 該当の注文をロックする
        parent = getattr(instance, position)
        parent.is_locked = True
        parent.save()
    
        ''' 既に発注済みの場合は元の注文をキャンセル '''
        if not instance.cancel():
            # 元キャンセル失敗の場合はそのまま
            parent.is_locked = False
            parent.save()
            return None
        else:
            instance.delete()
            new_instance = RelationSerializer._create_order(validated_data)
            # 新しい注文オブジェクトをセット
            setattr(parent, attr_name, new_instance)
            parent.is_locked = False
            parent.save()
            return new_instance
    
    def validate(self, data):
        GET_TICKER_FAILED_ERROR = ValidationError('レートの取得に失敗しました')
        GET_ASSET_FAILED_ERROR = ValidationError('資産の取得に失敗しました')
        INSUFFICIENT_AMOUNT_ERROR = ValidationError({ 'amount': '数量が不足しています' })
        AMOUNT_TOO_SMALL_ERROR = ValidationError({ 'amount': '数量が小さすぎます' })
        GENERAL_ERROR = ValidationError('hoge')

        data = super().validate(data)

        # 新規発注の場合はそのままリターン
        if 'auto_id' not in data:
            return data
        try:
            order = Order.objects.get(auto_id = data['auto_id'])
        except:
            print('order not found')
            raise GENERAL_ERROR
        try:
            user = User.objects.get(id = data['id'])
        except:
            raise GENERAL_ERROR
        
        market = data['market']
        symbol = data['symbol']
        side = data['side']
        amount = data['amount']
        
        asset_name = order.symbol.split('/')[0] if side == SIDE_SELL else order.symbol.split('/')[1]
        asset = user.fetch_balance(market, asset_name)
        if not asset:
            raise GET_ASSET_FAILED_ERROR
        
        position = order.myposition
        parent = getattr(order, position)
        
        ## すでに注文している場合はその金額を戻す
        if order.status in { STATUS_UNFILLED }:
            if order.side == SIDE_SELL:
                asset += order.amount
            else:
                # 買いの場合はレート * 数量を戻す
                if order.is_limit_order:
                    rate = order.price
                else:
                    ticker = Ticker.get_ticker(market, symbol)
                    if ticker:
                        rate = ticker.last
                    else:
                        raise GET_TICKER_FAILED_ERROR
                asset += order.start_amount * rate
    
        # IFDの場合
        if parent.special_order in { ORDER_IFD, ORDER_IFDOCO } and parent.order_1 != order:
            ifdorder = parent.order_1
            # 売の場合は数量のみ考慮
            if side == SIDE_SELL:
                asset_at_the_point = asset + (ifdorder.amount if ifdorder.side == SIDE_BUY else -1 * ifdorder.amount )
                if amount > asset_at_the_point:
                    raise INSUFFICIENT_AMOUNT_ERROR
            # 買いの場合は持っている金額考慮
            else:
                if order.is_limit_order:
                    rate = data['price']
                else:
                    ticker = Ticker.get_ticker(market, symbol)
                    if ticker:
                        rate = ticker.last
                    else:
                        raise GET_TICKER_FAILED_ERROR
                money_required = rate * amount
                
                if ifdorder.is_limit_order:
                    ifdrate = ifdorder.price
                else:
                    ticker = Ticker.get_ticker(market, symbol)
                    if ticker:
                        ifdrate = ticker.last
                    else:
                        raise GET_TICKER_FAILED_ERROR

                money_possess = asset + ifdrate * ifdorder.amount * (1 if ifdorder.side == SIDE_SELL else -1)
                if money_required > money_possess:
                    raise INSUFFICIENT_AMOUNT_ERROR
        else:
            if side == SIDE_SELL:
                if amount > asset:
                    raise INSUFFICIENT_AMOUNT_ERROR
                if order.is_limit_order:
                    rate = data['price']
                else:
                    ticker = Ticker.get_ticker(market, symbol)
                    if ticker:
                        ifdrate = ticker.last
                    else:
                       raise GET_TICKER_FAILED_ERROR
                if rate * amount > asset:
                    raise INSUFFICIENT_AMOUNT_ERROR
        # coincheckの新規注文の場合は0.005以上の取引であること
        if data['market'] == MARKET_COINCHECK and data['amount'] < 0.005:
            raise AMOUNT_TOO_SMALL_ERROR
        return data


class RelationSerializer(serializers.ModelSerializer):
    order_1 = OrderSerializer(many = False, required = False, allow_null = True)
    order_2 = OrderSerializer(many = False, required = False, allow_null = True)
    order_3 = OrderSerializer(many = False, required = False, allow_null = True)
    
    class Meta:
        model = Relation
        fields = ('id', 'user', 'market', 'symbol', 'special_order', 'order_1', 'order_2', 'order_3', 'placed_at', 'is_active')
        read_only_fields = ('id', 'placed_at', 'is_active')
    @staticmethod
    def _create_order(validated_order_data):
        instance = Order(**validated_order_data)
        if validated_order_data['type'] == TYPE_TRAIL:
            market = validated_order_data['market']
            symbol = validated_order_data['symbol']
            
            ticker = Ticker.get_ticker(market, symbol)
            if not ticker:
                instance.status = STATUS_FAILED_TO_ORDER
                instance.error_message = 'レートの取得に失敗しました'
            else:
                last_price = ticker['last']
                instance.trail_price = last_price     
        instance.save()    
        instance.place()
        
        return instance

    def create(self, validated_data):
        print(validated_data)
        special_order = validated_data['special_order']
        relation = Relation()
        relation.user = validated_data['user']
        relation.market = validated_data['market']
        relation.symbol = validated_data['symbol']
        relation.special_order = special_order

        if special_order == ORDER_SINGLE:
            order1_data = validated_data.pop('order_1')
            order1_data['status'] = STATUS_READY_TO_ORDER
            order1 = RelationSerializer._create_order(order1_data)
            relation.order_1 = order1
            if order1.status == STATUS_FAILED_TO_ORDER:
                relation.is_active = False
            
            relation.save()
            return relation

        elif special_order == ORDER_IFD:
            order1_data = validated_data.pop('order_1')
            order2_data = validated_data.pop('order_2')
            order1_data['status'] = STATUS_READY_TO_ORDER
            order2_data['status'] = STATUS_WAIT_OTHER_ORDER_TO_FILL
            
            order1 = RelationSerializer._create_order(order1_data)
            relation.order_1 = order1

            if order1.status == STATUS_FAILED_TO_ORDER:
                relation.is_active = False
                relation.save()
                return relation
        
            order2 = RelationSerializer._create_order(order2_data)
            relation.order_2 = order2
            relation.save()
            return relation

        elif special_order == ORDER_OCO:
            order2_data = validated_data.pop('order_2')
            order3_data = validated_data.pop('order_3')
            order2_data['status'] = STATUS_READY_TO_ORDER
            order3_data['status'] = STATUS_READY_TO_ORDER
            

            order2 = RelationSerializer._create_order(order2_data)
            relation.order_2 = order2
            if order2.status == STATUS_FAILED_TO_ORDER:
                relation.is_active = False
                relation.save()
                return relation
            
            order3 = RelationSerializer._create_order(order3_data)
            relation.order_3 = order3
            if order3.status == STATUS_FAILED_TO_ORDER:
                order2.cancel()
                relation.is_active = False
            relation.save()
            return relation
            
        elif special_order == Relation.ORDER_IFDOCO:
            order1_data = validated_data.pop('order_1')
            order2_data = validated_data.pop('order_2')
            order3_data = validated_data.pop('order_3')
            order1_data['status'] = STATUS_READY_TO_ORDER
            order2_data['status'] = STATUS_WAIT_OTHER_ORDER_TO_FILL
            order3_data['status'] = STATUS_WAIT_OTHER_ORDER_TO_FILL
            
            order1 = RelationSerializer._create_order(order1_data)
            if order1.status == STATUS_FAILED_TO_ORDER:
                relation.is_active = False
                relation.save()
                return relation
            
            order2 = RelationSerializer._create_order(order2_data)   
            order3 = RelationSerializer._create_order(order3_data)

            relation.order_1 = order1
            relation.order_2 = order2
            relation.order_3 = order3
            relation.save()
            return relation
        
