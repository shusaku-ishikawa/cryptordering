import json
import logging
import os
from datetime import datetime, timedelta
import time
import python_bitbankcc
from django.core.management.base import BaseCommand
from django.template.loader import get_template
from ...serializer import *
from ...models import Relation, Order, User
from ...coincheck.coincheck import CoinCheck


class Command(BaseCommand):
    # python manage.py help count_entryで表示されるメッセージ
    help = '本家と注文を同期します'
    # コマンドが実行された際に呼ばれるメソッド
    def handle(self, *args, **options):
        logger = logging.getLogger('sync_orders')
        time_started = time.time()
        n = 0
        while True:
            time.sleep(1)
            n = n + 1
            time_elapsed = time.time() - time_started
            if time_elapsed > 57.0:
                break;
            
            for user in User.objects.filter(is_active = True):
                
                # bitbank sync start
                try:
                    logger.info('start sync bitbank')
                    prv_bb = python_bitbankcc.private(user.bb_api_key, user.bb_api_secret_key)
                    for pair in Relation.PAIR:
                        to = datetime.now()
                        since = to - timedelta(minutes = 10)
                        
                        active = prv_bb.get_active_orders(
                            pair,
                            {
                                'since': int(since.timestamp()),
                                'end': int(to.timestamp())
                            }
                        )
                        history = prv_bb.get_trade_history(
                            pair,
                            {
                                'count': 10,
                                'since': int(since.timestamp() * 1000),
                                'end': int(to.timestamp() * 1000)
                            }
                        )
                    
                        for o in active['orders']:
                            logger.info('bitbank active order found : ' + str(o['order_id']))
                            print(o)
                            exist = Order.objects.filter(order_id = o['order_id'])
                            if len(exist) == 0:
                                logger.info('this order does not exist in db. start sync : ' + str(o['order_id']))
                                o['market'] = 'bitbank'
                                o['order_type'] = o['type']
                                os = OrderSerializer(data = o, context = {'user': user})
                                if os.is_valid():
                                    o1 = os.save()
                                else:
                                    print(os.errors)
                                    continue

                                relation = Relation()
                                relation.user = user
                                relation.market = 'bitbank'
                                relation.pair = o['pair']
                                relation.special_order = 'SINGLE'
                                relation.order_1 = o1
                                relation.save()
                            else:
                                logger.info('this order already exists in db')

                        for o in history['trades']:
                            print(o)
                            logger.info('bitbank closed order found : ' + str(o['order_id']))
                            exist = Order.objects.filter(order_id = o['order_id'])
                            if len(exist) == 0:
                                logger.info('this order does not exist in db. start sync : ' + str(o['order_id']))
                                o['market'] = 'bitbank'
                                o['order_type'] = o['type']
                                o['status'] = Order.STATUS_FULLY_FILLED
                                o['ordered_at'] = o['executed_at']

                                os = OrderSerializer(data = o, context = {'user': user})
                                if os.is_valid():
                                    o1 = os.save()
                                else:
                                    print(os.errors)
                                    continue
                            else:
                                logger.info('this order already exists in db')

                except Exception as e:
                    logger.error('while sync bitbank:' + 'user:' + user.email + ' message: ' +  str(e.args))
                    pass

                try:
                    logger.info('start sync coincheck')
                    prv_cc = CoinCheck(user.cc_api_key, user.cc_api_secret_key)
                    pair = 'btc_jpy'

                    pag = {
                        'limit': 10,
                        'order': 'desc'
                    }
                    ao = json.loads(prv_cc.order.opens({}))
                    co = json.loads(prv_cc.order.transactions(pag))
                    if ao['success']:
                        for o in ao['orders']:
                            exist = Order.objects.filter(order_id = o['id'])
                            if len(exist) == 0:
                                logger.info('this order does not exist in db. start sync : ' + str(o['id']))
                                o['market'] = 'coincheck'
                                o['order_id'] = o['id']
                                o['side'] = 'sell' if 'sell' in o['order_type'] else 'buy'
                                o['order_type'] = 'market' if 'market' in o['order_type'] else 'limit'
                                o['price'] = o['rate']
                                o['start_amount'] = o['pending_amount']
                                o['status'] = Order.STATUS_UNFILLED
                                os = OrderSerializer(data = o, context = {'user': user})
                                if os.is_valid():
                                    o1 = os.save()
                                else:
                                    print(os.errors)
                                    continue
                            else:
                                logger.info('this order already exists in db')
                        
                        for o in co['transactions']:
                            path
                except Exception as e:
                    print(str(e.args))
                