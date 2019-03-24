import json
import logging
import os
from datetime import datetime
import time

from django.core.management.base import BaseCommand
from django.template.loader import get_template

from ...models import Relation, Order

class Command(BaseCommand):
    # python manage.py help count_entryで表示されるメッセージ
    help = '注文のステータスを更新します'
    # コマンドが実行された際に呼ばれるメソッド
    def handle(self, *args, **options):
        logger = logging.getLogger('batch_logger')
        #logger.info('started')
        time_started = time.time()
        n = 0
        while True:
            time.sleep(1)
            n = n + 1
            time_elapsed = time.time() - time_started
            if time_elapsed > 57.0:
                break;
            relations = Relation.objects.filter(is_active=True)
            for relation in relations:
                o_1 = relation.order_1
                o_2 = relation.order_2
                o_3 = relation.order_3

                # Order#1が存在する場合
                if o_1 != None:
                    # Order#1が未約定の場合はステータス更新
                    if o_1.status in {Order.STATUS_PARTIALLY_FILLED, Order.STATUS_UNFILLED}:
                        o_1.update()
                    # 更新後、約定済みであった場合
                    if o_1.status == Order.STATUS_FULLY_FILLED: 
                        relation.order_1 = None
                        if o_2 != None and o_2.status in {Order.STATUS_WAIT_OTHER_ORDER_TO_FILL}:
                            relation.special_order = 'SINGLE'

                            if 'stop' in o_2.order_type or 'trail' in o_2.order_type:
                                o_2.status = Order.STATUS_READY_TO_ORDER
                            else:
                                if not o_2.place():
                                    if o_3 != None:
                                        if o_3.status in {Order.STATUS_PARTIALLY_FILLED, Order.STATUS_UNFILLED}:
                                            o_3.cancel()
                                        else:
                                            o_3.status = Order.STATUS_CANCELED_UNFILLED
                
                                
                        if o_3 != None and o_3.status in {Order.STATUS_WAIT_OTHER_ORDER_TO_FILL}:
                            relation.special_order = 'OCO'
                            if 'stop' in o_3.order_type or 'trail' in o_3.order_type:
                                o_3.status = Order.STATUS_READY_TO_ORDER
                            else:
                                if not o_3.place():
                                    if o_2 != None:
                                        if o_2.status in {Order.STATUS_PARTIALLY_FILLED, Order.STATUS_UNFILLED}:
                                            o_2.cancel()
                                        else:
                                            o_2.status = Order.STATUS_CANCELED_UNFILLED
                        

                        if relation.user.notify_if_filled == 'ON':
                            # 約定通知メール
                            o_1.notify_user()

                    # 本家でキャンセルされていた場合
                    elif o_1.status in {Order.STATUS_CANCELED_PARTIALLY_FILLED, Order.STATUS_CANCELED_UNFILLED, Order.STATUS_FAILED_TO_ORDER}:
                        if o_2 != None and o_2.status in {Order.STATUS_WAIT_OTHER_ORDER_TO_FILL}:
                            o_2.status = Order.STATUS_CANCELED_UNFILLED
                        if o_3 != None and o_3.status in {Order.STATUS_WAIT_OTHER_ORDER_TO_FILL}:
                            o_3.status = Order.STATUS_CANCELED_UNFILLED

                if o_2 != None:
                    if o_2.status in {Order.STATUS_UNFILLED, Order.STATUS_PARTIALLY_FILLED}:
                        o_2.update()
                    if o_2.status  == Order.STATUS_FULLY_FILLED:
                        # order_3のキャンセル
                        if o_3 != None:
                            if o_3.status in {Order.STATUS_UNFILLED, Order.STATUS_PARTIALLY_FILLED}:
                                o_3.cancel()
                            else:
                                o_3.status = Order.STATUS_CANCELED_UNFILLED

                        if relation.user.notify_if_filled == 'ON':
                            # 約定通知メール
                            o_2.notify_user()

                    elif o_2.status in {Order.STATUS_CANCELED_PARTIALLY_FILLED, Order.STATUS_CANCELED_UNFILLED}:
                        if o_3 != None:
                            relation.order_2 = o_3
                            relation.order_3 = None
                            relation.special_order = 'SINGLE'

                if o_3 != None:
                    if o_3.status in {Order.STATUS_UNFILLED, Order.STATUS_PARTIALLY_FILLED}:
                        o_3.update()
                    if o_3.status  == Order.STATUS_FULLY_FILLED:
                        # order_2のキャンセル
                        if o_2 != None:
                            if o_2.status in {Order.STATUS_PARTIALLY_FILLED, Order.STATUS_UNFILLED}:
                                o_2.cancel()
                            else:
                                o_2.status = Order.STATUS_CANCELED_UNFILLED
                                
                        if relation.user.notify_if_filled == 'ON':
                            # 約定通知メール
                            o_3.notify_user()
                    elif o_3.status in {Order.STATUS_CANCELED_PARTIALLY_FILLED, Order.STATUS_CANCELED_UNFILLED}:
                        if o_2 != None:
                            relation.order_3 = None
                            relation.special_order = 'SINGLE'

                if (o_1 == None or o_1.status in {Order.STATUS_FULLY_FILLED, Order.STATUS_CANCELED_UNFILLED, Order.STATUS_CANCELED_PARTIALLY_FILLED, Order.STATUS_FAILED_TO_ORDER}) \
                    and (o_2 == None or o_2.status in {Order.STATUS_FULLY_FILLED, Order.STATUS_CANCELED_UNFILLED, Order.STATUS_CANCELED_PARTIALLY_FILLED, Order.STATUS_FAILED_TO_ORDER}) \
                    and (o_3 == None or o_3.status in {Order.STATUS_FULLY_FILLED, Order.STATUS_CANCELED_UNFILLED, Order.STATUS_CANCELED_PARTIALLY_FILLED, Order.STATUS_FAILED_TO_ORDER}):
                    relation.is_active = False
                if o_1 != None:
                    o_1.save()
                if o_2 != None:
                    o_2.save()
                if o_3 != None:
                    o_3.save()
                relation.save()

        logger.info('completed')
