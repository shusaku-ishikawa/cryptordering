from rest_framework import viewsets
from core.models import *
from api.serializer import *
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView
from binance.client import Client
from rest_framework import status
from django.shortcuts import get_object_or_404
from core.enums import *
from rest_framework import status
import json, math
from django.http import Http404, HttpResponseBadRequest, JsonResponse

PAGE_SIZE = 10
'''
    トークン取得処理
'''
class CustomObtainAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        response = super(CustomObtainAuthToken, self).post(request, *args, **kwargs)
        token = Token.objects.get(key=response.data['token'])
        user = User.objects.get(id = token.user_id)
        return Response({'token': token.key, 'id': user.id, 'bb_api_key': user.bb_api_key, 'bb_api_secret_key': user.bb_api_secret_key, 'cc_api_key': user.cc_api_key, 'cc_api_secret_key': user.cc_api_secret_key, 'use_alert': user.use_alert, 'notify_if_filled': user.notify_if_filled })

class UserViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)
    authentication_classes = (TokenAuthentication,)
    queryset = User.objects.all()
    serializer_class = UserSerializer

class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)
    authentication_classes = (TokenAuthentication,)
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

    def list(self, request):
        qs = self.queryset.filter(user = request.user, status = STATUS_FULLY_FILLED)
        page_count = math.ceil(len(qs) / PAGE_SIZE)
        # pagination
        page = request.GET.get('page')
        if page:
            offset = (int(page) - 1) * PAGE_SIZE
            qs = qs[offset:offset + PAGE_SIZE]
        data = OrderSerializer(qs, many = True).data
        return Response(status=status.HTTP_200_OK, data = {'result': data, 'page_count': page_count})

class AssetView(APIView):
    permission_classes = (IsAuthenticated,)
    authentication_classes = (TokenAuthentication,)

    def get(self, request, format=None):
        market = request.GET.get('market')
        user = request.user
        
        if market == MARKET_BITBANK:
            if not user.bb_api_key or not user.bb_api_secret_key:
                return Response(status=status.HTTP_400_BAD_REQUEST, data={ 'error': 'APIキーが登録されていません' })
            try:
                data = python_bitbankcc.private(user.bb_api_key, user.bb_api_secret_key).get_asset()
            except Exception as e:
                print(str(e))
                return Response(status=status.HTTP_503_SERVICE_UNAVAILABLE, data={ 'error': str(e.args) })
            else:
                return Response(status=status.HTTP_200_OK, data=data)
        elif market == MARKET_COINCHECK:
            data = json.loads(CoinCheck(user.cc_api_key, user.cc_api_secret_key).account.balance({}))
            if 'error' in data:
                return Response(status=status.HTTP_503_SERVICE_UNAVAILABLE, data={ 'error': data.get('error') })
            else:
                assets = []
                for key in data:
                    if not '_' in key and key != 'success':
                        assets.append({ 'asset': key, 'onhand_amount': float(data.get(key)) })
                
                return Response(status=status.HTTP_200_OK, data={'assets': assets})
        else:
            return Response(status=status.HTTP_400_BAD_REQUEST, data={ 'error': 'no data passed' })

class TickerView(APIView):
    permission_classes = (IsAuthenticated,)
    authentication_classes = (TokenAuthentication,)

    def get(self, request, format=None):
        market = request.GET.get('market')
        pair = request.GET.get('pair')
        if market == MARKET_BITBANK:
            try:
                data = python_bitbankcc.public().get_ticker(pair)
            except Exception as e:
                return Response(status.status.HTTP_503_SERVICE_UNAVAILABLE, data={'error': 'レートの取得に失敗しました'})
            else:
                return Response(status=status.HTTP_200_OK, data = data)
        elif market == MARKET_COINCHECK:
            data = json.loads(CoinCheck('fake', 'fake').ticker.all())
            if 'error' in data:
                return Response(status.status.HTTP_503_SERVICE_UNAVAILABLE, data={'error': 'レートの取得に失敗しました'})
            else:
                return Response(status=status.HTTP_200_OK, data = data)        

class AlertViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)
    authentication_classes = (TokenAuthentication,)
    queryset = Alert.objects.all()
    serializer_class = AlertSerializer
        
    def list(self, request):
        qs = self.queryset.filter(user = request.user, is_active = True)
        page_count = math.ceil(len(qs) / PAGE_SIZE)
        # pagination
        page = request.GET.get('page')
        if page:
            offset = (int(page) - 1) * PAGE_SIZE
            qs = qs[offset:offset + PAGE_SIZE]
        data = AlertSerializer(qs, many = True).data
        return Response(status=status.HTTP_200_OK, data = {'result': data, 'page_count': page_count})

    def create(self, request):
        print(request.data)
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

       