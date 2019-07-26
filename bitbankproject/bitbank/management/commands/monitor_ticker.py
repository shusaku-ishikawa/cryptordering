import json
import logging
import os
import time 
import python_bitbankcc
from django.core.management.base import BaseCommand

from ...models import Relation,Order, User, Alert
from ...coincheck.coincheck import CoinCheck
from ...myexceptions import *

def deactivate_order_relation(relation):
    relation.order_1 = None
    relation.order_2 = None
    relation.order_3 = None
    relation.is_active = False
    relation.save()

def cancel_oco_other_order(order):
    # 本注文がOCO注文であった場合、注文前に他方をキャンセルする
    try:
        position = order.myposition
    except:
        try:
            order.cancel()
        except:
            pass
        finally:
            return False
    # 自身が注文2である場合はまず注文3をキャンセル
    if position == 'settle_order_1':
        parent = getattr(order, position)
        # OCOの場合
        if parent.special_order == Relation.ORDER_OCO:
            try:
                parent.order_3.cancel()
            except OrderCancelFailedError:
                try:
                    order.cancel()
                except OrderCancelFailedError:
                    deactivate_order_relation(parent)
                    return False
                else:
                    # 自身のキャンセルに成功したらSINGLEへ
                    parent.order_1 = parent.order_3
                    parent.order_2 = None
                    parent.order_3 = None
                    parent.special_order = 'SINGLE'
                    parent.save()
                    return False
            else:
                # 他方のキャンセルに成功した場合はSINGLEへ
                parent.order_1 = order
                parent.order_2 = None
                parent.order_3 = None
                parent.special_order = 'SINGLE'
                parent.save()
                return True
        else:
            logger.error('注文の構成が不正です:{}'.format(parent.pk))
        
    # 自身が注文3である場合は注文2をキャンセル
    elif position == 'settle_order_2':
        parent = getattr(order, position)
        if parent.special_order == Relation.ORDER_OCO:
            try:
                parent.order_2.cancel()
            except OrderCancelFailedError:
                try:
                    order.cancel()
                except OrderCancelFailedError:
                    deactivate_order_relation(parent)
                    return False
                else:
                    # 自身のキャンセルに成功したらSINGLEへ
                    parent.order_1 = parent.order_2
                    parent.order_2 = None
                    parent.order_3 = None
                    parent.special_order = 'SINGLE'
                    parent.save()
                    return False
            else:
                # 他方のキャンセルに成功した場合はSINGLEへ
                parent.order_1 = order
                parent.order_2 = None
                parent.order_3 = None
                parent.special_order = 'SINGLE'
                parent.save()
                return True
        else:
            logger.error('注文の構成が不正です:{}'.format(parent.pk))

    # OCO以外の場合はTrue
    else:
        return True
      
class Command(BaseCommand):
    help = '逆指値、ストップリミット注文を出します'
    def _get_market_price(self, market, pair):
        pub_bb = python_bitbankcc.public()
        pub_cc = CoinCheck('fake', 'fake')

        if market == 'bitbank':
            ret = pub_bb.get_ticker(pair)
            return float(pub_bb.get_ticker(pair)['last'])
        else:
            ret = json.loads(pub_cc.ticker.all())
            return float(ret['last'])
    
    # コマンドが実行された際に呼ばれるメソッド
    def handle(self, *args, **options):
        logger = logging.getLogger('monitor_ticker')
        logger.info('started')
        time_started = time.time()
        n = 0
        
        while True:
            time.sleep(1)
            n = n + 1
            time_elapsed = time.time() - time_started
            if time_elapsed > 57.0:
                break;
            
            # 通貨ペアをイテレーション
            for market in Relation.MARKET:
                for pair in Relation.PAIR:
                    try:
                        rate = self._get_market_price(market, pair)
                    except ValueError as e:
                        logger.error('エラー:{}'.format(e.args))
                        pass
                    else:
                        # 有効なアラートを取得
                        alerts_by_pair = Alert.objects.filter(market = market, pair=pair,is_active=True)
                        for alert in alerts_by_pair:
                            if (alert.over_or_under == 'over' and rate >= alert.rate) or \
                                (alert.over_or_under == 'under' and rate < alert.rate):
                                alert.notify_user()
                                    
                        # 逆指値の注文取得
                        stop_market_orders_by_pair = Order.objects.filter(market = market, pair = pair, order_type = Order.TYPE_STOP_MARKET, order_id__isnull = True, status__in = [Order.STATUS_READY_TO_ORDER])
                        for stop_market_order in stop_market_orders_by_pair:
                            logger.info('逆指値{side}: ストップ金額={stop_price} 現在買レート={buy_rate} 現在売レート={sell_rate}'.format(side=stop_market_order.side, stop_price=stop_market_order.price_for_stop, buy_rate=rate, sell_rate=rate))
                            
                            if (stop_market_order.side == 'sell' and (rate <= stop_market_order.price_for_stop)) or \
                                (stop_market_order.side == 'buy' and (rate >= stop_market_order.price_for_stop)):
                                
                                # 親を取得
                                try:
                                    parent = getattr(stop_market_order, stop_market_order.myposition)
                                    # ロックされている場合は無視
                                    if parent.is_locked:
                                        continue
                                except:
                                    # 親がいない場合
                                    try:
                                        stop_market_order.cancel()
                                    except:
                                        pass
                                # OCOの場合は他方キャンセル
                                is_succeeded = cancel_oco_other_order(stop_market_order)
                                if is_succeeded: # 他方のキャンセルに成功した場合
                                    stop_market_order.place()
                                    if stop_market_order.status == Order.STATUS_FAILED_TO_ORDER:
                                        deactivate_order_relation(parent)
                                        logger.error( '逆指値注文:{pk}の注文が失敗しました。{error}'.format(pk = stop_market_order.pk, error = stop_market_order.error_message) )
                                    else:
                                        logger.info( '逆指値注文:{order_id}を注文しました'.format(order_id = stop_market_order.order_id) )


                        # ストップリミットの注文取得
                        stop_limit_orders_by_pair = Order.objects.filter(market = market, pair = pair, order_type = Order.TYPE_STOP_LIMIT, order_id__isnull = True, status__in = [Order.STATUS_READY_TO_ORDER])
                        for stop_limit_order in stop_limit_orders_by_pair:
                            logger.info('ストップリミット{side}: ストップ金額={stop_price} 現在買レート={buy_rate} 現在売レート={sell_rate}'.format(side=stop_limit_order.side, stop_price=stop_limit_order.price_for_stop, buy_rate=rate, sell_rate=rate))

                            if (stop_limit_order.side == 'sell' and (rate <= stop_limit_order.price_for_stop)) or \
                                (stop_limit_order.side == 'buy' and (rate >= stop_limit_order.price_for_stop)):
                                # 親を取得
                                try:
                                    parent = getattr(stop_limit_order, stop_limit_order.myposition)
                                    # ロックされている場合は無視
                                    if parent.is_locked:
                                        continue
                                except:
                                    try:
                                        stop_limit_order.cancel()
                                    except:
                                        pass
                                # OCOの場合は他方キャンセル
                                is_succeeded = cancel_oco_other_order(stop_limit_order)
                                if is_succeeded:
                                    stop_limit_order.place()
                                    if stop_limit_order.status == Order.STATUS_FAILED_TO_ORDER:
                                        deactivate_order_relation(parent)
                                        logger.error( 'ストップリミット注文:{pk}の注文が失敗しました。{error}'.format(pk = stop_limit_order.pk, error = stop_limit_order.error_message) )
                                    else:
                                        logger.info( 'ストップリミット注文:{order_id}を注文しました'.format(order_id = stop_limit_order.order_id) )
                            
                    
                        # トレール注文取得
                        trail_orders_by_pair = Order.objects.filter(market = market, pair = pair, order_type = Order.TYPE_TRAIL, order_id__isnull = True, status__in = [Order.STATUS_READY_TO_ORDER])
                        for trail_order in trail_orders_by_pair:
                            logger.info('トレール{side}: トレール金額={trail_price} 現在買レート={buy_rate} 現在売レート={sell_rate}'.format(side=trail_order.side , trail_price=trail_order.trail_price, buy_rate=rate, sell_rate=rate))
                            
                            try:
                                parent = getattr(trail_order, trail_order.myposition)
                                # ロックされている場合は無視
                                if parent.is_locked:
                                    continue
                            except:
                                try:
                                    trail_order.cancel()
                                except:
                                    pass
                            if trail_order.side == 'sell':
                                if trail_order.trail_price > rate:
                                    # OCOの場合は他方キャンセル
                                    is_succeeded = cancel_oco_other_order(trail_order)
                                    if is_succeeded:
                                        trail_order.place()
                                        if trail_order.status == Order.STATUS_FAILED_TO_ORDER:
                                            deactivate_order_relation(parent)
                                            logger.error( 'トレール注文:{pk}の注文が失敗しました。{error}'.format(pk = stop_market_order.pk, error = trail_order.error_message ) )
                                        else:
                                            logger.info( 'トレール注文:{order_id}を注文しました'.format(order_id = trail_order.order_id) )
                                
                                elif rate > trail_order.trail_price + trail_order.trail_width:
                                    trail_order.trail_price = rate - trail_order.trail_width
                            else:
                                if trail_order.trail_price <= rate:
                                    # OCOの場合は他方キャンセル
                                    is_succeeded = cancel_oco_other_order(trail_order)
                                    if is_succeeded:
                                        trail_order.place()
                                        if trail_order.status == Order.STATUS_FAILED_TO_ORDER:
                                            deactivate_order_relation(parent)
                                            logger.error( 'トレール注文:{pk}の注文が失敗しました。{error}'.format(pk = trail_order.pk, error = trail_order.error_message) )
                                        else:
                                            logger.info( 'トレール注文:{order_id}を注文しました'.format(order_id = trail_order.order_id) )
                            
                                elif rate <= trail_order.trail_price - trail_order.trail_width:
                                    trail_order.trail_price = rate + trail_order.trail_width

        logger.info('completed')  
          
