from rest_framework import viewsets
from core.models import *
from api.serializer import *
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.shortcuts import get_object_or_404
from core.enums import *
from rest_framework import status
import json, math
from django.http import Http404, HttpResponseBadRequest, JsonResponse
import ccxt
from django.contrib.sites.shortcuts import get_current_site
from django.core.signing import BadSignature, SignatureExpired, dumps, loads
from django.views import generic

PAGE_SIZE = 4
'''
    トークン取得処理
'''
class CustomObtainAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        response = super(CustomObtainAuthToken, self).post(request, *args, **kwargs)
        token = Token.objects.get(key=response.data['token'])
        user = User.objects.get(id = token.user_id)
        return Response({'token': token.key, 'id': user.id, 'bb_api_key': user.bb_api_key, 'bb_api_secret_key': user.bb_api_secret_key, 'cc_api_key': user.cc_api_key, 'cc_api_secret_key': user.cc_api_secret_key, 'use_alert': user.use_alert, 'notify_if_filled': user.notify_if_filled })

class SignUpView(APIView):
    permission_classes = []
    authentication_classes = []
    serializer_class = UserSerializer
    
    def post(self, request, format=None):
        serializer = self.serializer_class(data = request.data)
        if serializer.is_valid():
            user = serializer.save()
            current_site = get_current_site(request)
            domain = current_site.domain

            bankinfo = BankInfo.get_bank_info()

            context = {
                'protocol': self.request.scheme,
                'domain': domain,
                'token': dumps(user.pk),
                'user': user,
                'bank': bankinfo.bank,
                'branch': bankinfo.branch,
                'meigi': bankinfo.meigi,
                'type': bankinfo.type,
                'number': bankinfo.number
            }
            subject = get_template('mail_template/create/subject.txt').render(context)
            message = get_template('mail_template/create/message.txt').render(context)
            # subject_for_admin =  get_template('mail_template/create_to_admin/subject.txt').render(context)
            # message_for_admin = get_template('mail_template/create_to_admin/message.txt').render(context)

            # for su in User.objects.filter(is_superuser = True):
            #     su.email_user(subject_for_admin, message_for_admin)
            user.email_user(subject, message)
            return Response(status = status.HTTP_200_OK, data = {})
        else:
            print(serializer.errors)
            return Response(status = status.HTTP_400_BAD_REQUEST, data = serializer.errors)
        return None

class PasswordResetView(APIView):
    permission_classes = []
    authentication_classes = []
    serializer_class = None
    
    def get(self, request, format=None):
        email = request.GET.get('email')
        print(email)
        user = get_object_or_404(User, email = email)

        context = {
            'token': dumps(user.pk),
            'user': user
        }
        subject = get_template('mail_template/password_reset/subject.txt').render(context)
        message = get_template('mail_template/password_reset/message.txt').render(context)
        user.email_user(subject, message)
        return Response(status = status.HTTP_200_OK, data = {})  
    def post(self, request, format=None):
        """tokenが正しければ本登録."""
        serializer = PasswordResetSerializer(data = request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(status = status.HTTP_200_OK)
        else:
            print(serializer.errors)
            return Response(status = status.HTTP_400_BAD_REQUEST, data = serializer.errors)

class PasswordChangeView(APIView):
    permission_classes = (IsAuthenticated,)
    authentication_classes = (TokenAuthentication,)         
    serializer_class = PasswordChangeSerializer
    def post(self, request, format = None):
        serializer = self.serializer_class(data = request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.data.get('old_password')):
                return Response(status=status.HTTP_400_BAD_REQUEST, data = {'old_password': ['現在のパスワードが異なります']})
            # set_password also hashes the password that the user will get
            user.set_password(serializer.data.get('new_password_1'))
            user.save()
            return Response(status = status.HTTP_200_OK)
        else:
            print(serializer.errors)
            return Response(status = status.HTTP_400_BAD_REQUEST, data = serializer.errors)


class UserViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)
    authentication_classes = (TokenAuthentication,)
    queryset = User.objects.all()
    serializer_class = UserSerializer

class ContactView(APIView):
    permission_classes = (IsAuthenticated,)
    authentication_classes = (TokenAuthentication,)
    serializer_class = InquirySerializer
    def post(self, request, format=None):
        params = request.data.copy()
        params['user'] = request.user.id
        serializer = self.serializer_class(data = params)
        if serializer.is_valid():
            serializer.save()
            return Response(status = status.HTTP_200_OK, data = { 'success': True })
        else:
            print(serializer.errors)
            return Response(status = status.HTTP_400_BAD_REQUEST, data = serializer.errors)


class RelationViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)
    authentication_classes = (TokenAuthentication,)
    queryset = Relation.objects.all()
    serializer_class = RelationSerializer
    
    def list(self, request):
        market = request.GET.get('market') or 'all'
        symbol = request.GET.get('symbol') or 'all'
        
        qs = self.queryset.filter(user = request.user, is_active = True).order_by('-pk')
        if market != '' and market != 'all':
            qs = qs.filter(market = market)
        if symbol != '' and symbol != 'all':
            qs = qs.filter(symbol = symbol)

        page_count = math.ceil(len(qs) / PAGE_SIZE)
        # pagination
        page = request.GET.get('page')
        if page:
            offset = (int(page) - 1) * PAGE_SIZE
            qs = qs[offset:offset + PAGE_SIZE]
        data = RelationSerializer(qs, many = True).data
        return Response(status=status.HTTP_200_OK, data = {'result': data, 'page_count': page_count})

    def create(self, request):
        params = request.data.copy()
        print(params)
        user = request.user
        market = params.get('market')
        symbol = params.get('symbol')
        
        params['user'] = user.id
        if params.get('order_1') != None:
            params.get('order_1')['user'] = user.id
            params.get('order_1')['market'] = market
            params.get('order_1')['symbol'] = symbol
        if params.get('order_2') != None:
            params.get('order_2')['user'] = user.id
            params.get('order_2')['market'] = market
            params.get('order_2')['symbol'] = symbol
        if params.get('order_3') != None:
            params.get('order_3')['user'] = user.id
            params.get('order_3')['market'] = market
            params.get('order_3')['symbol'] = symbol
            
        serializer = RelationSerializer(data = params)
        if serializer.is_valid():
            relation = serializer.save()
            if relation.is_active:
                return Response(status = status.HTTP_200_OK, data = { 'success': True })
            else:
                return Response(status = status.HTTP_400_BAD_REQUEST, data = { 'non_field_errors': relation.errors })
        else:
            print(serializer.errors)
            return Response(status = status.HTTP_400_BAD_REQUEST, data = serializer.errors)
        return

class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)
    authentication_classes = (TokenAuthentication,)
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

    def list(self, request):
        market = request.GET.get('market') or 'all'
        symbol = request.GET.get('symbol') or 'all'
        qs = self.queryset.filter(user = request.user, status = STATUS_FULLY_FILLED).order_by('-updated_at')
        if market != '' and market != 'all':
            qs = qs.filter(market = market)
        if symbol != '' and symbol != 'all':
            qs = qs.filter(symbol = symbol)

        page_count = math.ceil(len(qs) / PAGE_SIZE)
        # pagination
        page = request.GET.get('page')
        if page:
            offset = (int(page) - 1) * PAGE_SIZE
            qs = qs[offset:offset + PAGE_SIZE]
        
        data = OrderSerializer(qs, many = True).data
        return Response(status=status.HTTP_200_OK, data = {'result': data, 'page_count': page_count})

    def destroy(self, request, pk = None):
        order = get_object_or_404(Order, auto_id = pk)
        if not order.cancel():
            return Response(status = status.HTTP_400_BAD_REQUEST, data = { 'non_field_errors': [order.error_message] })
            
        
        # 新規注文をキャンセルした場合は特殊注文無効化
        if order.myposition == POSITION_NEW_ORDER:
            relation = Relation.objects.get(order_1 = order)
            relation.order_1 = None
            relation.is_active = False
            relation.save()
            return Response(status = status.HTTP_200_OK)
        # 決済注文１をキャンセルした場合
        elif order.myposition == POSITION_SETTLE_ORDER_1:
            relation = Relation.objects.get(order_2 = order)
            # IFDの場合
            if relation.order_3 == None:
                relation.order_2 = None
                relation.special_order = ORDER_SINGLE
            # OCOの場合
            elif relation.order_1 == None:
                relation.order_1 = relation.order_3
                relation.order_2 = None
                relation.order_3 = None
                relation.special_order = ORDER_SINGLE
            # IFDOCO
            else:
                relation.order_2 = relation.order_3
                relation.order_3 = None
                relation.special_order = ORDER_IFD
            relation.save()
            return Response(status = status.HTTP_200_OK)
        # 決済注文2をキャンセルした場合
        elif order.myposition == POSITION_SETTLE_ORDER_2:
            relation = Relation.objects.get(order_3 = order)
            # OCOの場合
            if relation.order_1 == None:
                relation.order_1 = relation.order_2
                relation.order_2 = None
                relation.order_3 = None
                relation.special_order = ORDER_SINGLE
            # IFDOCOの場合
            else:
                relation.order_3 = None
                relation.special_order = ORDER_IFD
            relation.save()
            return Response(status = status.HTTP_200_OK)
    
    def partial_update(self, request, pk):
        order = get_object_or_404(Order, auto_id = pk)
        params = request.data.copy()
        params['user'] = request.user.id
        current_status = order.status
        # IFDの約定待ちの注文を更新する場合
        if current_status == STATUS_WAIT_OTHER_ORDER_TO_FILL:
            params['status'] = current_status
        # すでに注文ずみか、監視モードの注文か注文失敗となっている場合
        elif current_status in { STATUS_READY_TO_ORDER, STATUS_UNFILLED, STATUS_PARTIALLY_FILLED, STATUS_FAILED_TO_ORDER }:
            params['status'] = STATUS_READY_TO_ORDER
        # 想定外のステータスの場合
        else:
            print(params['status'])
            return Response(status = status.HTTP_400_BAD_REQUEST)
        
        serializer = OrderSerializer(data = params, instance = order)
        if not serializer.is_valid():
            print('in is_valid')
            return Response(status = status.HTTP_400_BAD_REQUEST, data = serializer.errors)
        else:                 
            updated_order = serializer.save()
            if not updated_order:
                print('この注文はキャンセルできません')
                return Response(status = status.HTTP_400_BAD_REQUEST, data = { 'status': '元注文のキャンセルに失敗しました'})
            else:
                if updated_order.status == STATUS_FAILED_TO_ORDER:
                    return Response(status = status.HTTP_400_BAD_REQUEST, data = { 'non_field_errors': updated_order.error_message })
                return Response(status = status.HTTP_200_OK)   

class AssetView(APIView):
    permission_classes = (IsAuthenticated,)
    authentication_classes = (TokenAuthentication,)

    def get(self, request, format=None):
        market = request.GET.get('market')
        user = request.user
        data = user.fetch_balance(market)
        if data:
            return Response(status = status.HTTP_200_OK, data = data)
        else:
            return Response(status = status.HTTP_400_BAD_REQUEST)
    
class TickerView(APIView):
    permission_classes = (IsAuthenticated,)
    authentication_classes = (TokenAuthentication,)

    def get(self, request, format=None):
        market = request.GET.get('market')
        symbol = request.GET.get('symbol')
        print(symbol)
        client_class = getattr(ccxt, market)
        client = client_class()
        
        try:
            if symbol:
                data = client.fetch_ticker(symbol)
            else:
                data = client.fetch_tickers()
        except ccxt.NetworkError as e:
            return Response(status = status.HTTP_503_SERVICE_UNAVAILABLE, data = { 'error': str(e) })    
        else:
            return Response(status = status.HTTP_200_OK, data = data)
        
class AlertViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)
    authentication_classes = (TokenAuthentication,)
    queryset = Alert.objects.all()
    serializer_class = AlertSerializer
        
    def list(self, request):
        market = request.GET.get('market') or 'all'
        symbol = request.GET.get('symbol') or 'all'
        qs = self.queryset.filter(user = request.user, is_active = True)
        if market != '' and market != 'all':
            qs = qs.filter(market = market)
        if symbol != '' and symbol != 'all':
            qs = qs.filter(symbol = symbol)

        page_count = math.ceil(len(qs) / PAGE_SIZE)
        # pagination
        page = request.GET.get('page') or 1
        offset = (int(page) - 1) * PAGE_SIZE
        qs = qs[offset:offset + PAGE_SIZE]
        data = AlertSerializer(qs, many = True).data
        user_settings = UserSerializer(request.user, many = False).data
        return Response(status=status.HTTP_200_OK, data = {'result': data, 'page_count': page_count, 'user_settings': user_settings})

    def create(self, request):
        serializer = AlertSerializer(data = request.data, context={'user': request.user})
        if serializer.is_valid():
            serializer.save()
            return Response(status=status.HTTP_201_CREATED, data={'success': True})
        else:
            return Response(status=status.HTTP_400_BAD_REQUEST, data=serializer.errors)

    def partial_update(self, request, pk=None):
        # PATCH  :  /api/users/:id/
        pass

    def destroy(self, request, pk=None):
        obj = get_object_or_404(Alert, id = pk)
        obj.is_active = False
        obj.save()
        return Response(status=status.HTTP_200_OK,data={'success': True})

       