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
    help = '本家と注文を同期します'
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
                logger.info('start sync bitbank')
                prv_bb = python_bitbankcc.private(user.bb_api_key, user.bb_api_secret_key)
                for pair in Relation.PAIR:
                 
                    time.sleep(0.1)
                    to = datetime.now()
                    since = to - timedelta(seconds = 10)
                    option = {
                        'count': 10,
                        'since': int(since.timestamp() * 1000),
                        'end': int(to.timestamp() * 1000)
                    }
                    try:
                        active = prv_bb.get_active_orders(pair, option)
                        for o in active['orders']:
                            time.sleep(0.3)
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
                                    logger.error(str(os.errors))
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
                    except Exception as e:
                        logger.error('while sync active bb ' + pair + ' user:' + user.email + ' ' + str(e.args))
                        pass
                    try:
                    
                        history = prv_bb.get_trade_history(pair, option)
                        for o in history['trades']:
                            time.sleep(0.1)
                            print(o)
                            logger.info('bitbank closed order found : ' + str(o['order_id']))
                            exist = Order.objects.filter(order_id = o['order_id'])
                            if len(exist) == 0:
                                logger.info('this order does not exist in db. start sync : ' + str(o['order_id']))
                                o['market'] = 'bitbank'
                                o['order_type'] = o['type']
                                o['status'] = Order.STATUS_FULLY_FILLED
                                o['ordered_at'] = o['executed_at']
                                o['start_amount'] = o['amount']
                                o['executed_amount'] = o['amount']
                                os = OrderSerializer(data = o, context = {'user': user})
                                if os.is_valid():
                                    o1 = os.save()
                                else:
                                    logger.error(str(os.errors))
                                    continue
                            else:
                                logger.info('this order already exists in db')

                    except Exception as e:
                        logger.error('while sync history bb ' + pair + ' user:' + user.email + ' ' + str(e.args))
                        pass

                
                logger.info('start sync coincheck')
                prv_cc = CoinCheck(user.cc_api_key, user.cc_api_secret_key)
                pair = 'btc_jpy'

                pag = {
                    'limit': 10,
                    'order': 'desc'
                }
                try:
                    ao = json.loads(prv_cc.order.opens({}))
                    if ao['success']:
                        for o in ao['orders']:
                            exist = Order.objects.filter(order_id = o['id'])
                            if len(exist) == 0:
                                logger.info('this active order does not exist in db. start sync : ' + str(o['id']))
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
                                    logger.error(str(os.errors))
                                    continue
                                relation = Relation()
                                relation.user = user
                                relation.market = 'coincheck'
                                relation.pair = o['pair']
                                relation.special_order = 'SINGLE'
                                relation.order_1 = o1
                                relation.save()
                            else:
                                logger.info('this active order already exists in db')
                except Exception as e:
                    logger.error('while sync open cc ' + pair + ' user:' + user.email + ' ' + str(e.args))
                    pass
                
                try:
                    co = json.loads(prv_cc.order.transactions(pag))
                    if co['success']:
                        for o in co['transactions']:
                            exist = Order.objects.filter(order_id = o['order_id'])
                            if len(exist) == 0:
                                logger.info('this closed order does not exits in db. start sync: ' + str(o[('order_id')]) )
                                o['market'] = 'coincheck'
                                o['status'] = Order.STATUS_FULLY_FILLED

                                amount = float(o['funds']['btc']) if o['side'] == 'buy' else -1 * float(o['funds']['btc'])
                                for o2 in co['transactions']:
                                    if o['id'] != o2['id'] and o['order_id'] == o2['order_id']:
                                        amount += float(o2['funds']['btc']) if o2['side'] == 'buy' else -1 * float(o2['funds']['btc'])
                                
                                
                                o['executed_amount'] = amount
                                o['start_amount'] = amount
                                o['order_type'] = Order.TYPE_LIMIT
                                os = OrderSerializer(data = o, context = {'user': user})
                                if os.is_valid():
                                    o1 = os.save()
                                else:
                                    logger.error(str(os.errors))
                                    continue 
                                
                except Exception as e:
                    logger.error('while sync close cc ' + pair + ' user:' + user.email + ' ' + str(e.args))
                    pass
        logger.info('done')