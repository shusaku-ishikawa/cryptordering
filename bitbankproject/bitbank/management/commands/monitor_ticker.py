import json
import logging
import os
import time 
import python_bitbankcc
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.template.loader import get_template

from ...models import Relation,Order, User, Alert
from ...coincheck.coincheck import CoinCheck

# BaseCommandを継承して作成
class Command(BaseCommand):
    # python manage.py help count_entryで表示されるメッセージ
    help = '逆指値、ストップリミット注文を出します'

    def _get_market_price(self, market, pair):
        pub_bb = python_bitbankcc.public()
        pub_cc = CoinCheck('fake', 'fake')

        if market == 'bitbank':
            return float(pub_bb.get_ticker(pair)['last'])
        else:
            return float(pub_cc.ticker.all()['last'])

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
            
            # 通貨ペアをイテレーション
            for pair in Relation.PAIR:
                
                alerts_by_pair = Alert.objects.filter(pair=pair).filter(is_active=True)

                for alert in alerts_by_pair:
                    try:
                        rate = self._get_market_price(alert.market, pair)

                        if (alert.over_or_under == '以上' and rate >= alert.threshold) or \
                            (alert.over_or_under == '以上' and rate >= alert.threshold):

                            if alert.user.use_alert == 'ON':
                                context = { "user": alert.user, "rate": rate, "pair": pair }
                                subject = get_template('bitbank/mail_template/rate_notice/subject.txt').render(context)
                                message = get_template('bitbank/mail_template/rate_notice/message.txt').render(context)
                                alert.user.email_user(subject, message)
                                alert.alerted_at = timezone.now()
                                
                            alert.is_active = False
                            alert.save()
                    except Exception as e:
                        alert.is_active = False
                        alert.save()
                        logger.error('user:' + alert.user.email + ' pair:' + pair + ' alert:' + str(alert.pk) + ' error:' + str(e.args))

                # 逆指値の注文取得
                stop_market_orders_by_pair = Order.objects.filter(pair=pair).filter(order_type=Order.TYPE_STOP_MARKET).filter(order_id__isnull=True).filter(status__in=[Order.STATUS_READY_TO_ORDER])
                
                # 各注文を処理
                for stop_market_order in stop_market_orders_by_pair:

                    rate = self._get_market_price(stop_market_order.market, pair)

                    # 売りの場合
                    logger.info('Stop market order found. side:' + stop_market_order.side + ' stop price:' + str(stop_market_order.price_for_stop) + ' rate:' + str(rate))
                    if (stop_market_order.side == 'sell' and (rate <= stop_market_order.price_for_stop)) or \
                        (stop_market_order.side == 'buy' and (rate >= stop_market_order.price_for_stop)):
                        stop_market_order.place()

                # ストップリミットの注文取得
                stop_limit_orders_by_pair = Order.objects.filter(pair=pair).filter(order_type=Order.TYPE_STOP_LIMIT).filter(order_id__isnull=True).filter(status__in=[Order.STATUS_READY_TO_ORDER])
                
                # 各注文を処理
                for stop_limit_order in stop_limit_orders_by_pair:
                    rate = self._get_market_price(stop_limit_order.market, pair)
                    logger.info('Stop limit order found. side:' + stop_limit_order.side + ' stop price:' + str(stop_limit_order.price_for_stop) + ' rate:' + str(rate))
                    
                    if (stop_limit_order.side == 'sell' and (rate <= stop_limit_order.price_for_stop)) or \
                        (stop_limit_order.side == 'buy' and (rate >= stop_limit_order.price_for_stop)):
                        stop_limit_order.place()
                
                # トレール注文取得
                trail_orders_by_pair = Order.objects.filter(pair = pair).filter(order_type = Order.TYPE_TRAIL).filter(order_id__isnull = True).filter(status__in = [Order.STATUS_READY_TO_ORDER])

                # 各注文を処理
                for trail_order in trail_orders_by_pair:
                    rate = self._get_market_price(trail_order.market, pair)

                    logger.info('trail order found. side:' + trail_order.side + ' trail width:' + str(trail_order.trail_width))
                    if trail_order.side == 'sell':
                        if trail_order.trail_price > rate:
                            trail_order.place()
                        elif rate > trail_order.trail_price + trail_order.trail_width:
                            trail_order.trail_price = rate - trail_order.trail_width
                    else:
                        if trail_order.trail_price <= rate:
                            trail_order.place()
                        elif rate <= trail_order.trail_price - trail_order.trail_width:
                            trail_order.trail_price = rate + trail_order.trail_width

        logger.info('completed')  
          
