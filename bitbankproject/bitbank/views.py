import json
import logging
import os
import traceback

import python_bitbankcc
from .coincheck.coincheck import CoinCheck
from django import forms, http
from django.conf import settings
from django.contrib import messages
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.contrib.auth.views import (LoginView, LogoutView,
                                       PasswordChangeDoneView,
                                       PasswordChangeView,
                                       PasswordResetCompleteView,
                                       PasswordResetConfirmView,
                                       PasswordResetDoneView,
                                       PasswordResetView)
from django.contrib.sites.shortcuts import get_current_site
from django.core import serializers
from django.core.mail import EmailMultiAlternatives, send_mail
from django.core.signing import BadSignature, SignatureExpired, dumps, loads
from django.forms.utils import ErrorList
from django.http import Http404, HttpResponseBadRequest, JsonResponse
from django.shortcuts import redirect, resolve_url
from django.template.loader import get_template
from django.urls import reverse, reverse_lazy
from django.utils import timezone
from django.views import generic
from .models import _trim_error_msg

from .forms import (LoginForm, MyPasswordChangeForm, MyPasswordResetForm,
                    MySetPasswordForm, UserCreateForm, UserUpdateForm)
from .models import *
from .serializer import *
from .myexceptions import *
import re

class Login(LoginView):
    """ログインページ"""
    form_class = LoginForm
    template_name = 'bitbank/login.html'

class Logout(LoginRequiredMixin, LogoutView):
    """ログアウトページ"""
    template_name = 'bitbank/top.html'

class OnlyYouMixin(UserPassesTestMixin):
    raise_exception = True

    def test_func(self):
        user = self.request.user
        return user.pk == self.kwargs['pk'] or user.is_superuser

class UserCreate(generic.CreateView):
    """ユーザー仮登録"""
    template_name = 'bitbank/user_create.html'
    form_class = UserCreateForm

    def form_valid(self, form):
        """仮登録と本登録用メールの発行."""
        # 仮登録と本登録の切り替えは、is_active属性を使うと簡単です。
        # 退会処理も、is_activeをFalseにするだけにしておくと捗ります。
        user = form.save(commit=False)
        user.is_active = False
        user.save()

        # アクティベーションURLの送付
        current_site = get_current_site(self.request)
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

        subject = get_template('bitbank/mail_template/create/subject.txt').render(context)
        message = get_template('bitbank/mail_template/create/message.txt').render(context)
        subject_for_admin =  get_template('bitbank/mail_template/create_to_admin/subject.txt').render(context)
        message_for_admin = get_template('bitbank/mail_template/create_to_admin/message.txt').render(context)

        user.email_user(subject, message)
        for su in User.objects.filter(is_superuser = True):
            su.email_user(subject_for_admin, message_for_admin)

        return redirect('bitbank:user_create_done')


class UserCreateDone(generic.TemplateView):
    """ユーザー仮登録したよ"""
    template_name = 'bitbank/user_create_done.html'


class UserCreateComplete(generic.TemplateView):
    """メール内URLアクセス後のユーザー本登録"""
    template_name = 'bitbank/user_create_complete.html'
    timeout_seconds = getattr(settings, 'ACTIVATION_TIMEOUT_SECONDS', 60*60*24)  # デフォルトでは1日以内

    def get(self, request, **kwargs):
        """tokenが正しければ本登録."""
        token = kwargs.get('token')
        try:
            user_pk = loads(token, max_age=self.timeout_seconds)

        # 期限切れ
        except SignatureExpired:
            return HttpResponseBadRequest()

        # tokenが間違っている
        except BadSignature:
            return HttpResponseBadRequest()

        # tokenは問題なし
        else:
            try:
                user = User.objects.get(pk=user_pk)
            except User.DoesNotExist:
                return HttpResponseBadRequest()
            else:
                if not user.is_active:
                    # 問題なければ本登録とする
                    user.is_active = True
                    user.save()
                    return super().get(request, **kwargs)

        return HttpResponseBadRequest()

class PasswordChange(PasswordChangeView):
    """パスワード変更ビュー"""
    form_class = MyPasswordChangeForm
    success_url = reverse_lazy('bitbank:password_change_done')
    template_name = 'bitbank/password_change.html'


class PasswordChangeDone(PasswordChangeDoneView):
    """パスワード変更しました"""
    template_name = 'bitbank/password_change_done.html'

class PasswordReset(PasswordResetView):
    """パスワード変更用URLの送付ページ"""
    subject_template_name = 'bitbank/mail_template/password_reset/subject.txt'
    email_template_name = 'bitbank/mail_template/password_reset/message.txt'
    template_name = 'bitbank/password_reset_form.html'
    form_class = MyPasswordResetForm
    success_url = reverse_lazy('bitbank:password_reset_done')


class PasswordResetDone(PasswordResetDoneView):
    """パスワード変更用URLを送りましたページ"""
    template_name = 'bitbank/password_reset_done.html'


class PasswordResetConfirm(PasswordResetConfirmView):
    """新パスワード入力ページ"""
    form_class = MySetPasswordForm
    success_url = reverse_lazy('bitbank:password_reset_complete')
    template_name = 'bitbank/password_reset_confirm.html'


class PasswordResetComplete(PasswordResetCompleteView):
    """新パスワード設定しましたページ"""
    template_name = 'bitbank/password_reset_complete.html'

class MainPage(LoginRequiredMixin, generic.TemplateView):
    """メインページ"""
    template_name = 'bitbank/order.html'

    def get_context_data(self, **kwargs):
        context = super(MainPage, self).get_context_data(**kwargs)
        context['notify_if_filled'] = User.objects.filter(pk=self.request.user.pk).get().notify_if_filled
        return context

def change_notify_if_filled(request):
    if request.user.is_anonymous or request.user.is_active == False:
        return JsonResponse({'error' : 'authentication failed'}, status=401)
    
    user = request.user
    if request.method == 'POST':
        try:
            val = request.POST.get('notify_if_filled')
            user.notify_if_filled = val
            user.save()
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'error': str(e.args)})

def change_use_alert(request):
    if request.user.is_anonymous or request.user.is_active == False:
        return JsonResponse({'error' : 'authentication failed'}, status=401)
    
    user = request.user
    if request.method == 'POST':
        try:
            val = request.POST.get('use_alert')
        except KeyError as e:
            return JsonResponse({'error': str(e.args)})
        else:
            user.use_alert = val
            user.save()
            return JsonResponse({'success': True})
        

def ajax_user(request):
    if request.user.is_anonymous or request.user.is_active == False:
        return JsonResponse({'error' : 'authentication failed'}, status=401)

    method = request.method
    user = request.user

    if method == 'GET':
        serizlized = UserSerializer(request.user, many=False).data
        
        return JsonResponse(serizlized)

    elif method == 'POST':
        serializer = UserSerializer(user, data = request.POST)
        if serializer.is_valid():
            serializer.save()
            return JsonResponse({'success': True}) 
        else:
            return JsonResponse({'error': serializer.errors})
           
def ajax_alerts(request):
    if request.user.is_anonymous or request.user.is_active == False:
        return JsonResponse({'error' : 'authentication failed'}, status=401)

    user = request.user
    method = request.method

    if method == 'GET':

        offset = int(request.GET.get('offset'))
        to = int(request.GET.get('limit')) + offset
        search_market = request.GET.get('market')
        search_pair = request.GET.get('pair')

        alerts = Alert.objects.filter(user=user).filter(is_active=True)

        
        if search_market != 'all':
            alerts = alerts.filter(market=search_market)
        if search_pair != 'all':
            alerts = alerts.filter(pair=search_pair)
            
        data = {
            'total_count': alerts.count(),
            'data': AlertSerializer(alerts.order_by('-pk')[offset:to], many=True ).data
        }
        return JsonResponse(data)
    elif method == 'POST':
        op = request.POST.get('method')
        if op == 'DELETE':
            pk = request.POST.get('pk')
            try:
                Alert.objects.filter(pk=pk).update(is_active=False)
                return JsonResponse({'success': True})
            except Exception as e:
                traceback.print_exc()
                return JsonResponse({'error': e.args})
        elif op == 'POST':
            serializer = AlertSerializer(data = request.POST, context={'user': user})
            if serializer.is_valid():
                serializer.save()
                return JsonResponse({'success': True})
            else:
                print(str(serializer.errors) + " gttetetet")
                return JsonResponse({'error': _get_error_message(serializer.errors, '') })

def _get_ticker(market, pair):
    res = python_bitbankcc.public().get_ticker(pair) if market == 'bitbank' else json.loads(CoinCheck('fake', 'fake').ticker.all())
    if 'error' in res:
        raise Exception(res['error'])
    return res
def ajax_ticker(request):
    if request.user.is_anonymous or request.user.is_active == False:
        return JsonResponse({'error' : 'authentication failed'}, status=401)

    if request.method == 'GET':
        market = request.GET.get('market');
        pair = request.GET.get('pair')
        try:
            result = _get_ticker(market, pair)
        except Exception as e:
            return JsonResponse({'error': '{}のレートの取得に失敗しました'.format(market) })
        else:
            return JsonResponse(result)

def _get_asset(market, user):
    if market == 'bitbank':
        try:
            res_dict = python_bitbankcc.private(user.bb_api_key, user.bb_api_secret_key).get_asset()
        except Exception as e:
            raise
            
    elif market == 'coincheck':
        res_dict = json.loads(CoinCheck(user.cc_api_key, user.cc_api_secret_key).account.balance({}))
        if 'error' in res_dict:
            raise Exception('{}の資産の取得に失敗しました'.format(market))
    return res_dict

def ajax_assets(request):
    logger = logging.getLogger('api')

    if request.user.is_anonymous or request.user.is_active == False:
        return JsonResponse({'error' : 'authentication failed'}, status=401)

    if request.method == 'GET':
        
        user = request.user
        try:
            market = request.GET.get('market')
        except KeyError as e:
            return JsonResponse({'error': str(e.args)})
        else:
            try:
                result = _get_asset(market, user)
            except Exception as e:
                return JsonResponse({'error': _trim_error_msg(e.args[0]) })
            else:
                return JsonResponse(result) 



def _get_error_message(errors, str_order):
    _fields = {
        'pair': '通貨',
        'market': '取引所',
        'start_amount': '注文数量',
        'price': '指値金額',
        'price_for_stop': '逆指値金額',
        'trail_width': 'トレール幅',
        'rate': '通知レート',
        'non_field_errors': ''
    }
    error_key = list(errors.keys())[0]
    error_val = errors[error_key][0]
    return str_order + ' ' + _fields[error_key] + ': ' + error_val

def ajax_order(request):
    logger = logging.getLogger('api')

    if request.user.is_anonymous or request.user.is_active == False:
        return JsonResponse({'error' : 'authentication failed'}, status=401)

    user = request.user
    method = request.method
    if method == 'GET':     
        try:
            offset = int(request.GET.get('offset'))
            to = int(request.GET.get('limit')) + offset
        except ValueError:
            return JsonResponse({'error': '入力値が不正です'})
        else:
            search_market = request.GET.get('market')
            search_pair = request.GET.get('pair')
            order_history = Order.objects.filter(user=user).filter(status__in=[Order.STATUS_CANCELED_PARTIALLY_FILLED, Order.STATUS_FULLY_FILLED, Order.STATUS_FAILED_TO_ORDER])
            
            if search_market != 'all':
                order_history = order_history.filter(market = search_market)
            if search_pair != 'all':
                order_history = order_history.filter(pair = search_pair)
            
            data = {
                'total_count': order_history.count(),
                'data': OrderSerializer(order_history.order_by('-pk')[offset:to], many=True).data
            }
            return JsonResponse(data)

    elif method == 'POST':
        op = request.POST.get('method')
        if op == 'DELETE':
            pk = request.POST.get("pk")
            try:
                order = Order.objects.get(pk = pk)
            except Order.DoesNotExist:
                return JsonResponse({'error': '対象の注文が存在しません'})
            else:
                if order.order_id != None:
                    try:
                        order.cancel()
                    except OrderCancelFailedError as e:
                        return JsonResponse({'error': 'この注文はキャンセルできません' })
                else:
                    # 未発注の場合はステータスをキャンセル済みに変更
                    print('here')
                    order.status = 'CANCELED_UNFILLED'
                    order.save()
                    
                try:
                    relation = Relation.objects.get(order_1 = order)
                except Relation.DoesNotExist:
                    pass
                else:
                    ''' 新規注文をキャンセルした場合は特殊注文無効化 '''
                    relation.is_active = False
                    relation.save()
                    return JsonResponse({'success': True})

                try:
                    relation = Relation.objects.get(order_2 = order)
                except Relation.DoesNotExist:
                    pass
                else:
                    # IFDの場合
                    if relation.order_3 == None:
                        relation.order_2 = None
                        relation.special_order = 'SINGLE'
                    # OCOの場合
                    elif relation.order_1 == None:
                        relation.order_1 = relation.order_3
                        relation.order_2 = None
                        relation.order_3 = None
                        relation.special_order = 'SINGLE'
                    # IFDOCO
                    else:
                        relation.order_2 = relation.order_3
                        relation.order_3 = None
                        relation.special_order = 'IFD'
                    relation.save()
                    return JsonResponse({'success': True})

                try:
                    relation = Relation.objects.get(order_3 = order)
                except:
                    
                    return JsonResponse({'error': '親の注文が存在しません'})
                else:
                    # OCOの場合
                    if relation.order_1 == None:
                        relation.order_1 = relation.order_2
                        relation.order_2 = None
                        relation.order_3 = None
                        relation.special_order = 'SINGLE'
                    # IFDOCOの場合
                    else:
                        relation.order_3 = None
                        relation.special_order = 'IFD'
                    relation.save()
                    return JsonResponse({'success': True})
               
        elif op == 'UPDATE':
            ''' パラメータ '''
            try:
                pk = request.POST.get('pk')
                order = Order.objects.get(pk = pk)
            except KeyError  as e:
                return JsonResponse({'error': 'キー:pk が存在しません' })
            except Order.DoesNotExist:
                return JsonResponse({'error': '対象の注文が存在しません'})
            else:
                param = request.POST.copy()
                param['market'] = order.market
                param['pair'] = order.pair
                
                current_status = order.status

                
                # IFDの約定待ちの注文を更新する場合
                if current_status == Order.STATUS_WAIT_OTHER_ORDER_TO_FILL:
                    param['status'] = current_status
                # すでに注文ずみか、監視モードの注文か注文失敗となっている場合
                elif current_status in { Order.STATUS_READY_TO_ORDER, Order.STATUS_UNFILLED, Order.STATUS_PARTIALLY_FILLED, Order.STATUS_FAILED_TO_ORDER }:
                    param['status'] = Order.STATUS_READY_TO_ORDER
                # 想定外のステータスの場合
                else:
                    return JsonResponse({'error': 'この注文は更新できません'})

                serializer = OrderSerializer(data = param, instance = order, context = {'user': user})
                if serializer.is_valid():
                    side = param['side']
                    order_type = param['order_type']
                    amount = float(param['start_amount'])
                    
                    asset_name = order.pair.split('_')[0] if side == 'sell' else order.pair.split('_')[1]
                    
                    try:
                        assets = _get_asset(order.market, request.user)['assets']
                    except Exception as e:
                        print(e)
                        return JsonResponse({'error': '資産の取得に失敗しました'})
                    else:
                        position = order.myposition
                        parent = getattr(order, position)
                    asset = float([asset for asset in assets if asset['asset'] == asset_name ][0]['onhand_amount'])
                    
                    ## すでに注文している場合はその金額を戻す
                    if order.status in { Order.STATUS_UNFILLED }:
                        amount += order.start_amount
                
                    # IFDの場合
                    if parent.special_order in { Relation.ORDER_IFD, Relation.ORDER_IFDOCO }:
                        ifdorder = parent.order_1
                        # 売の場合は数量のみ考慮
                        if side == 'sell':
                            asset_at_the_point = asset + (ifdorder.start_amount if ifdorder.side == 'buy' else -1 * ifdorder.start_amount )
                            if amount > asset_at_the_point:
                                return JsonResponse({'error': '数量が不足しております'})
                        # 買いの場合は持っている金額考慮
                        else:
                            if 'limit' in order_type:
                                rate = float(param['price'])
                            else:
                                try:
                                    rate = float(_get_ticker(order.market, order.pair)['last'])
                                except Exception as e:
                                    return JsonResponse({'error': _trim_error_msg(e.args[0]) })
                            money_required = rate * amount
                            
                            if 'limit' in ifdorder.order_type:
                                ifdrate = ifdorder.price
                            else:
                                try:
                                    ifdrate = float(_get_ticker(order.market, order.pair)['last'])
                                except Exception as e:
                                    return JsonResponse({'error': _trim_error_msg(e.args[0]) })
                                
                            money_possess = asset + ifdrate * ifdorder.start_amount * (1 if ifdorder.side == 'sell' else -1)
                            if money_required > money_possess:
                                return JsonResponse({'error': '数量が不足しております'})
                    else:
                        if side == 'sell':
                            if amount > asset:
                                return JsonResponse({'error': '数量が不足しております'})
                        else:
                            if 'limit' in order_type:
                                rate = float(param['price'])
                            else:
                                try:
                                    rate = float(_get_ticker(order.market, order.pair)['last'])
                                except Exception as e:
                                    return JsonResponse({'error': _trim_error_msg(e.args[0]) })
                            print(assets)
                            if rate * amount > asset:
                                return JsonResponse({'error': '数量が不足しております'})
                    try:
                        updated_order = serializer.save()
                    except AlreadyFilledOrCancelledError:
                        return JsonResponse({'error': '対象の注文は既に約定済みかキャンセル済みです'})
                    except OrderCancelFailedError:
                        return JsonResponse({'error': '元の注文のキャンセルに失敗しました' })  
                    else:
                        if updated_order.status == Order.STATUS_FAILED_TO_ORDER:
                            return JsonResponse({'error': updated_order.error_message})
                        return JsonResponse({'success': True})
                else:
                    return JsonResponse({'error': _get_error_message(serializer.errors, '注文修正')})
                    

def ajax_relation(request):
    logger = logging.getLogger('api')

    if request.user.is_anonymous or request.user.is_active == False:
        return JsonResponse({'error' : 'authentication failed'}, status=401)

    user = request.user
    method = request.method
    if method == 'GET': 
        try:
            offset = int(request.GET.get('offset'))
            to = int(request.GET.get('limit')) + offset
        except ValueError:
            return JsonResponse({'error': 'リクエストパラメータが不正です'})
        else:
            search_market = request.GET.get('market')
            search_pair = request.GET.get('pair')

            active_orders = Relation.objects.filter(user = user, is_active = True)

            if search_market != "all":
                active_orders = active_orders.filter(market=search_market)
            if search_pair != "all":
                active_orders = active_orders.filter(pair=search_pair)

            data = {
                'total_count': active_orders.count(),
                'data': RelationSerializer(active_orders.order_by('-pk')[offset:to], many=True ).data
            }
            return JsonResponse(data)
           
    elif method == 'POST':
        op = request.POST.get('method')
        if op == 'POST':
            market = request.POST.get('market')
            pair = request.POST.get('pair')
            special_order = request.POST.get('special_order')

            relation = Relation()
            relation.user = user
            relation.market = market
            relation.pair = pair
            relation.special_order = special_order

            # SINGLE発注の時
            if special_order == Relation.ORDER_SINGLE:
                dic_o1 = json.loads(request.POST.get('order_1'))
                dic_o1['status'] = Order.STATUS_READY_TO_ORDER
                o_1_serializer = OrderSerializer(data = dic_o1, context = {'user': user})
                
                if o_1_serializer.is_valid():
                    o_1 = o_1_serializer.save()
                    if o_1.status == Order.STATUS_FAILED_TO_ORDER:
                        relation = None
                        return JsonResponse({'error': o_1.error_message})
                    relation.order_1 = o_1
                else:
                    return JsonResponse({'error': _get_error_message(o_1_serializer.errors, '新規注文')})
            # IFD注文の場合 
            elif special_order == Relation.ORDER_IFD:
                dic_o1 = json.loads(request.POST.get('order_1'))
                dic_o1['status'] = Order.STATUS_READY_TO_ORDER
                dic_o2 = json.loads(request.POST.get('order_2'))
                dic_o2['status'] = Order.STATUS_WAIT_OTHER_ORDER_TO_FILL

                o_1_serializer = OrderSerializer(data = dic_o1, context = {'user': user})
                o_2_serializer = OrderSerializer(data = dic_o2, context = {'user': user})
                
                if not o_1_serializer.is_valid():
                    relation = None
                    return JsonResponse({'error': _get_error_message(o_1_serializer.errors, '新規注文')})

                if not o_2_serializer.is_valid():
                    relation = None
                    return JsonResponse({'error': _get_error_message(o_2_serializer.errors, '決済注文①')})
                
                o_1 = o_1_serializer.save()
                # 注文1失敗時
                if o_1.status == Order.STATUS_FAILED_TO_ORDER:
                    relation = None
                    return JsonResponse({'error': o_1.error_message})
                ''' 新規が成功した場合 '''
                o_2 = o_2_serializer.save()
                relation.order_1 = o_1
                relation.order_2 = o_2
                
            elif special_order == Relation.ORDER_OCO:
                dic_o2 = json.loads(request.POST.get('order_2'))
                dic_o2['status'] = Order.STATUS_READY_TO_ORDER
                dic_o3 = json.loads(request.POST.get('order_3'))
                dic_o3['status'] = Order.STATUS_READY_TO_ORDER

                o_2_serializer = OrderSerializer(data = dic_o2, context = {'user': user})
                o_3_serializer = OrderSerializer(data = dic_o3, context = {'user': user})
                
                if not o_2_serializer.is_valid():
                    relation = None
                    return JsonResponse({'error': _get_error_message(o_2_serializer.errors, '決済注文①')})

                if not o_3_serializer.is_valid():
                    try:
                        o_2.cancel()
                    except:
                        pass
                    relation = None
                    return JsonResponse({'error': _get_error_message(o_3_serializer.errors, '決済注文②')})

                o_2 = o_2_serializer.save()
                # 注文2が失敗した場合は全体を無効化
                if o_2.status == Order.STATUS_FAILED_TO_ORDER:
                    relation = None
                    return JsonResponse({'error': o_2.error_message})
                o_3 = o_3_serializer.save()
                if o_3.status == Order.STATUS_FAILED_TO_ORDER:
                    relation = None
                    return JsonResponse({'error': o_3.error_message})
                    
                relation.order_2 = o_2
                relation.order_3 = o_3
    
            elif special_order == Relation.ORDER_IFDOCO:
                dic_o1 = json.loads(request.POST.get('order_1'))
                dic_o1['status'] = Order.STATUS_READY_TO_ORDER
                dic_o2 = json.loads(request.POST.get('order_2'))
                dic_o2['status'] = Order.STATUS_WAIT_OTHER_ORDER_TO_FILL
                dic_o3 = json.loads(request.POST.get('order_3'))
                dic_o3['status'] = Order.STATUS_WAIT_OTHER_ORDER_TO_FILL

                o_1_serializer = OrderSerializer(data = dic_o1, context = {'user': user})
                o_2_serializer = OrderSerializer(data = dic_o2, context = {'user': user})
                o_3_serializer = OrderSerializer(data = dic_o3, context = {'user': user})
                    
                if not o_1_serializer.is_valid():
                    relation = None
                    return JsonResponse({'error': _get_error_message(o_1_serializer.errors, '新規注文')})
                if not o_2_serializer.is_valid():
                    relation = None
                    return JsonResponse({'error': _get_error_message(o_2_serializer.errors, '決済注文①')})
                if not o_3_serializer.is_valid():
                    relation = None
                    return JsonResponse({'error': _get_error_message(o_3_serializer.errors, '決済注文②')})
                o_1 = o_1_serializer.save()
                if o_1.status == Order.STATUS_FAILED_TO_ORDER:
                    relation = None
                    return JsonResponse({'error': o_1.error_message})
                
                o_2 = o_2_serializer.save()
                if o_2.status == Order.STATUS_FAILED_TO_ORDER:
                    try:
                        o_1.cancel()
                    except:
                        pass
                    relation = None
                    return JsonResponse({'error': o_2.error_message})
                o_3 = o_3_serializer.save()
                if o_3.status == Order.STATUS_FAILED_TO_ORDER:
                    try:
                        o_1.cancel()
                    finally:
                        try:
                            o_2.cancel()
                        except:
                            pass

                    relation = None
                    return JsonResponse({'error': o_3.error_message})
                    
                relation.order_1 = o_1
                relation.order_2 = o_2
                relation.order_3 = o_3
                
            relation.is_active = True
            relation.save()

            return JsonResponse({'success': True})
            
       
def ajax_attachment(request):
    logger = logging.getLogger('api')

    if request.user.is_anonymous or request.user.is_active == False:
        return JsonResponse({'error' : 'authentication failed'}, status=401)

    method = request.method

    if method == 'POST':
        if request.POST.get('method') == 'DELETE':
            pk = request.POST.get('pk')
            Attachment.objects.filter(pk=pk).delete()
            return JsonResponse({'success': True})
        else:
            a = Attachment()
            a.file = request.FILES['attachment']
            a.save()
            return JsonResponse({'success': True, 'pk': a.pk, 'url': a.file.url})
def ajax_inquiry(request):
    logger = logging.getLogger('api')

    if request.user.is_anonymous or request.user.is_active == False:
        return JsonResponse({'error' : 'authentication failed'}, status=401)
        
    if request.method == 'POST':       
        new_inquiry = Inquiry()
        new_inquiry.user = request.user
        new_inquiry.subject = request.POST.get('subject')
        new_inquiry.body = request.POST.get('body')
        new_inquiry.email_for_reply = request.POST.get('email_for_reply')
        att_1_pk = request.POST.get('att_pk_1')
        att_2_pk = request.POST.get('att_pk_2')
        att_3_pk = request.POST.get('att_pk_3')
        
        error_msg = '添付ファイルの取得に失敗しました'
        if att_1_pk != None and att_1_pk != '':
            try:
                new_inquiry.attachment_1 = Attachment.objects.get(pk = att_1_pk)
            except Attachment.DoesNotExist as e:
                return JsonResponse({'error': error_msg })
        if att_2_pk != None and att_2_pk != '':
            try:
                new_inquiry.attachment_2 = Attachment.objects.get(pk = att_2_pk)
            except Attachment.DoesNotExist as e:
                return JsonResponse({'error': error_msg })
        if att_3_pk != None and att_3_pk != '':
            try:
                new_inquiry.attachment_3 = Attachment.objects.get(pk = att_3_pk)
            except Attachment.DoesNotExist as e:
                return JsonResponse({'error': error_msg })
        
        new_inquiry.save()
    
        context = {
            'new_inquiry': new_inquiry,
        }

        subject_template_for_admin = get_template('bitbank/mail_template/inquiry/subject.txt')
        subject_for_admin = subject_template_for_admin.render(context)
        message_template_for_admin = get_template('bitbank/mail_template/inquiry/message.txt')
        message_for_admin = message_template_for_admin.render(context)

        subject_template_for_customer = get_template('bitbank/mail_template/inquiry/subject_for_customer.txt')
        subject_for_customer = subject_template_for_customer.render(context)
        message_template_for_customer = get_template('bitbank/mail_template/inquiry/message_for_customer.txt')
        message_for_customer = message_template_for_customer.render(context)

        kwargs_for_admin = dict(
            to = [settings.DEFAULT_FROM_EMAIL],
            from_email = settings.DEFAULT_FROM_EMAIL,
            subject = subject_for_admin,
            body = message_for_admin,
        )
        kwargs_for_customer = dict(
            to = [request.POST.get('email_for_reply')],
            from_email = settings.DEFAULT_FROM_EMAIL,
            subject = subject_for_customer,
            body = message_for_customer,
        )
        msg_for_admin = EmailMultiAlternatives(**kwargs_for_admin)
        msg_for_customer = EmailMultiAlternatives(**kwargs_for_customer)
        
        if (new_inquiry.attachment_1 != None):
            msg_for_admin.attach_file(new_inquiry.attachment_1.file.path)
            msg_for_customer.attach_file(new_inquiry.attachment_1.file.path)
            
        if (new_inquiry.attachment_2 != None):
            msg_for_admin.attach_file(new_inquiry.attachment_2.file.path)
            msg_for_customer.attach_file(new_inquiry.attachment_2.file.path)
            
        if (new_inquiry.attachment_3 != None):
            msg_for_admin.attach_file(new_inquiry.attachment_3.file.path)
            msg_for_customer.attach_file(new_inquiry.attachment_3.file.path)

        msg_for_admin.send()
        msg_for_customer.send()
        return JsonResponse({'success': '問い合わせが完了しました'})
        