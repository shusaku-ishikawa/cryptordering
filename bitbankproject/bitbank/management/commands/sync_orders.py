import json
import logging
import os
from datetime import datetime, timedelta
import time
import python_bitbankcc
from django.core.management.base import BaseCommand
from django.template.loader import get_template

from ...models import Relation, Order, User


class Command(BaseCommand):
    # python manage.py help count_entryで表示されるメッセージ
    help = '本家と注文を同期します'
    # コマンドが実行された際に呼ばれるメソッド
    def handle(self, *args, **options):
        logger = logging.getLogger('batch_logger')
      
        for user in User.objects.all():
            # API KEYが登録されているユーザのみ処理
            if (user.api_key == "" or user.api_key == None) or (user.api_secret_key == "" or user.api_secret_key == None):
                # キー情報セット
                continue
        
            try:
                to = datetime.now()
                since = to - timedelta(days = 10)

                prv = python_bitbankcc.private(user.api_key, user.api_secret_key)
                
                active = prv.get_active_orders(
                    'btc_jpy',
                    {
                        'since': int(since.timestamp()),
                        'end': int(to.timestamp())
                    }
                )
                history = prv.get_trade_history(
                    'btc_jpy',
                    {
                        'count': 10,
                        'since': int(since.timestamp() * 1000),
                        'end': int(to.timestamp() * 1000)
                    }
                )
               

                for o in active['orders']:
                    print(o)
                for o in history['trades']:
                    exist = Order.objects.filter(order_id = o['order_id'])
                    if len(exist) == 0:
                        order = Order()
                        order.user = user
                        order.order_id = o['order_id']
                        order.pair = o['pair']
                        order.side = o['side']
                        order.order_type = o['type']
                        order.start_amount = o['amount']
                        order.executed_amount = o['amount']
                        order.average_price = o['price']
                        order.status = Order.STATUS_FULLY_FILLED
                        order.ordered_at = o['executed_at']
                        order.save()
                        

                        

                        


                

            except Exception as e:
                logger.error('user:' + user.email + ' message: ' +  str(e.args))
                continue
            
           