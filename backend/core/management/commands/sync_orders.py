import json
import logging
import os
from datetime import datetime, timedelta
import time
from django.core.management.base import BaseCommand
from django.template.loader import get_template
from api.serializer import *
from core.models import *
from core.enums import *
import ccxt

class Command(BaseCommand):
    help = '本家と注文を同期します'
    def handle(self, *args, **options):
        logger = logging.getLogger('sync_orders')
        time_started = time.time()
        n = 0
        # while True:
        #     time.sleep(1)
        #     n = n + 1
        #     time_elapsed = time.time() - time_started
        #     if time_elapsed > 57.0:
        #         break;
            
        for user in User.objects.filter(is_active = True):
            for market in [MARKET_BITBANK]:
                if market == MARKET_BITBANK and ( not user.bb_api_key or not user.bb_api_secret_key):
                    continue
                elif market == MARKET_COINCHECK and ( not user.cc_api_key or not user.cc_api_secret_key ):
                    continue

                for symbol in SYMBOLS:
                    time.sleep(2)
                    client_class = getattr(ccxt, market)
                    client = client_class({
                        'nonce': ccxt.Exchange.milliseconds,
                    })
                    if market == MARKET_BITBANK:
                        client.apiKey = user.bb_api_key
                        client.secret = user.bb_api_secret_key
                    elif market == MARKET_COINCHECK:
                        client.apiKey = user.cc_api_key
                        client.secret = user.cc_api_secret_key
                    try:
                        closed_orders = client.fetch_my_trades(
                            symbol,
                            None,
                            None,
                            {
                                'count': 10
                            }
                        )    
                    except Exception as e:
                        print('closed {market} {symbol} {err}'.format(market = market, symbol = symbol, err = e.args[0]))
                    else:
                        for closed_order in closed_orders:
                            order_id = closed_order.get('id')
                            try:
                                Order.objects.get(id = order_id)
                            except:
                                closed_order['market'] = market
                                closed_order['user'] = user.id
                                serializer = OrderSerializer(data = closed_order)
                                if serializer.is_valid():
                                    serializer.save()
                                else:
                                    print(serializer.errors)
                    try:
                        open_orders = client.fetch_open_orders(
                            symbol
                        )
                    except Exception as e:
                        print('open {market} {symbol} {err}'.format(market = market, symbol = symbol, err = e.args[0]))
                    
                    else:
                        for open_order in open_orders:
                            order_id = open_order.get('id')
                            try:
                                Order.objects.get(id = order_id)
                            except:
                                open_order['market'] = market
                                open_order['user'] = user.id
                                serializer = OrderSerializer(data = open_order)
                                if serializer.is_valid():
                                    order = serializer.save()
                                    relation = Relation()
                                    relation.user = user
                                    relation.market = market
                                    relation.symbol = symbol
                                    relation.special_order = ORDER_SINGLE
                                    relation.order_1 = order
                                    relation.save()
                                else:
                                    print(serializer.errors)
                        
                #     prv_bb = python_bitbankcc.private(user.bb_api_key, user.bb_api_secret_key)
                #     for symbol in Relation.PAIR:
                #         time.sleep(0.1)
                #         to = datetime.now()
                #         since = to - timedelta(seconds = 10)
                #         option = {
                #             'count': 10,
                #             'since': int(since.timestamp() * 1000),
                #             'end': int(to.timestamp() * 1000)
                #         }
                #         # アクティブ注文の反映
                #         try:
                #             active = prv_bb.get_active_orders(symbol, option)
                #         except Exception as e:
                #             logger.error( 'アクティブ注文の取得に失敗しました.{}'.format(str(e.args)) )
                #             pass
                #         else:
                #             for o in active['orders']:
                #                 time.sleep(0.3)
                #                 # DBを検索
                #                 try:
                #                     exist = Order.objects.get(order_id = o['order_id'])
                #                 # DBにない場合は反映
                #                 except Order.DoesNotExist:
                #                     logger.info( '新規注文:{}をDBへ反映します'.format(str(o['order_id'])) )
                #                     o['market'] = 'bitbank'
                #                     o['order_type'] = o['type']
                #                     os = OrderSerializer(data = o, context = {'user': user})
                #                     if os.is_valid():
                #                         o1 = os.save()
                #                     else:
                #                         logger.error( 'パラメタの反映に失敗しました.{}'.format(str(os.errors)) )
                #                         continue

                #                     relation = Relation()
                #                     relation.user = user
                #                     relation.market = 'bitbank'
                #                     relation.symbol = o['symbol']
                #                     relation.special_order = 'SINGLE'
                #                     relation.order_1 = o1
                #                     relation.save()
                #                 else:
                #                     # DBに存在する場合は
                #                     pass
                #         # 約定済み注文の反映 
                #         try:
                #             history = prv_bb.get_trade_history(symbol, option)
                #         except Exception as e:
                #             logger.error( '注文履歴の取得に失敗しました.{}'.format(str(e.args)) )
                #             pass
                #         else:
                #             for o in history['trades']:
                #                 time.sleep(0.1)
                #                 try:
                #                     exist = Order.objects.filter(order_id = o['order_id'])
                #                 except Order.DoesNotExist:
                #                     logger.info('注文履歴 {} をDBに反映します'.format( str(o['order_id'])) )
                #                     o['market'] = 'bitbank'
                #                     o['order_type'] = o['type']
                #                     o['status'] = Order.STATUS_FULLY_FILLED
                #                     o['ordered_at'] = o['executed_at']
                #                     o['start_amount'] = o['amount']
                #                     o['executed_amount'] = o['amount']
                #                     os = OrderSerializer(data = o, context = {'user': user})
                #                     if os.is_valid():
                #                         o1 = os.save()
                #                     else:
                #                         logger.error( 'パラメタエラー'.format(str(os.errors)) )
                #                         continue
                #                 else:
                #                     pass
                #     logger.info('coincheckの同期を開始します')
                #     prv_cc = CoinCheck(user.cc_api_key, user.cc_api_secret_key)
                #     symbol = 'btc_jpy'

                #     pag = {
                #         'limit': 10,
                #         'order': 'desc'
                #     }
                #     ao = json.loads(prv_cc.order.opens({}))
                #     if ao['success']:
                #         for o in ao['orders']:
                #             try:
                #                 exist = Order.objects.filter(order_id = o['id'])
                #             except Order.DoesNotExist:
                #                 logger.info('新規注文 :{} を同期します'.format(str(o['id'])) )
                #                 o['market'] = 'coincheck'
                #                 o['order_id'] = o['id']
                #                 o['side'] = 'sell' if 'sell' in o['order_type'] else 'buy'
                #                 o['order_type'] = 'market' if 'market' in o['order_type'] else 'limit'
                #                 o['price'] = o['rate']
                #                 o['start_amount'] = o['pending_amount']
                #                 o['status'] = Order.STATUS_UNFILLED
                #                 os = OrderSerializer(data = o, context = {'user': user})
                #                 if os.is_valid():
                #                     o1 = os.save()
                #                 else:
                #                     logger.error(str(os.errors))
                #                     continue
                #                 relation = Relation()
                #                 relation.user = user
                #                 relation.market = 'coincheck'
                #                 relation.symbol = o['symbol']
                #                 relation.special_order = 'SINGLE'
                #                 relation.order_1 = o1
                #                 relation.save()
                #             else:
                #                 pass
                #     elif ao['error']:
                #         logger.error('coincheckのアクティブ注文の動機に失敗しました.{}'.format(str(ao['error'])) )
                #     co = json.loads(prv_cc.order.transactions(pag))
                #     if co['success']:
                #         for o in co['transactions']:
                #             exist = Order.objects.filter(order_id = o['order_id'])
                #             if len(exist) == 0:
                #                 logger.info( '注文履歴{}を同期します'.format(str(o[('order_id')])) )
                #                 o['market'] = 'coincheck'
                #                 o['status'] = Order.STATUS_FULLY_FILLED

                #                 amount = float(o['funds']['btc']) if o['side'] == 'buy' else -1 * float(o['funds']['btc'])
                #                 for o2 in co['transactions']:
                #                     if o['id'] != o2['id'] and o['order_id'] == o2['order_id']:
                #                         amount += float(o2['funds']['btc']) if o2['side'] == 'buy' else -1 * float(o2['funds']['btc'])
                                
                #                 o['executed_amount'] = amount
                #                 o['start_amount'] = amount
                #                 o['order_type'] = Order.TYPE_LIMIT
                #                 os = OrderSerializer(data = o, context = {'user': user})
                #                 if os.is_valid():
                #                     o1 = os.save()
                #                 else:
                #                     logger.error(str(os.errors))
                #                     continue 
                #     elif co['errro']:
                #         logger.error( 'coincheckの注文履歴の同期に失敗しました.'.format(str(co['error'])) )        
                    
                # logger.info('done')