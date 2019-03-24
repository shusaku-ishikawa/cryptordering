import json
import logging
import os
from datetime import datetime, timedelta
import time
import python_bitbankcc
from django.core.management.base import BaseCommand
from django.template.loader import get_template

from ...models import Relation, Order, User
from ...coincheck.coincheck import CoinCheck


class Command(BaseCommand):
    # python manage.py help count_entryで表示されるメッセージ
    help = '本家と注文を同期します'
    # コマンドが実行された際に呼ばれるメソッド
    def handle(self, *args, **options):
        logger = logging.getLogger('batch_logger')
        time_started = time.time()
        n = 0
        while True:
            time.sleep(1)
            n = n + 1
            time_elapsed = time.time() - time_started
            if time_elapsed > 57.0:
                break;
            
            for user in User.objects.filter(is_active = True):
                prv_bb = python_bitbankcc.private(user.bb_api_key, user.bb_api_secret_key)
                prv_cc = CoinCheck(user.cc_api_key, user.cc_api_secret_key)
                for pair in Relation.PAIR:
                    # bitbank sync start
                    try:
                        to = datetime.now()
                        since = to - timedelta(days = 10)
                        
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
                            exist = Order.objects.filter(order_id = o['order_id'])
                            if len(exist) == 0:
                                order = Order()
                                order.user = user
                                order.order_id = o['order_id']
                                order.market = 'bitbank'
                                order.pair = o['pair']
                                order.side = o['side']
                                order.order_type = o['type']
                                order.start_amount = o['start_amount']
                                order.remaining_amount = o['remaining_amount']
                                order.executed_amount = o['executed_amount']
                                order.price = o['price']
                                order.status = o['status']
                                order.ordered_at = o['ordered_at']
                                order.save()
                                relation = Relation()
                                relation.user = user
                                relation.market = 'bitbank'
                                relation.pair = o['pair']
                                relation.special_order = 'SINGLE'
                                relation.order_1 = order
                                relation.save()

                        for o in history['trades']:
                            exist = Order.objects.filter(order_id = o['order_id'])
                            if len(exist) == 0:
                                order = Order()
                                order.user = user
                                order.order_id = o['order_id']
                                order.market = 'bitbank'
                                order.pair = o['pair']
                                order.side = o['side']
                                order.order_type = o['type']
                                order.start_amount = o['amount']
                                order.executed_amount = o['amount']
                                if o['type'] == 'limit':
                                    order.price = o['price']
                                order.average_price = o['price']
                                order.status = Order.STATUS_FULLY_FILLED
                                order.ordered_at = o['executed_at']
                                order.save()
                                    
                    except Exception as e:
                        logger.error('user:' + user.email + ' message: ' +  str(e.args))
                        continue
            
        