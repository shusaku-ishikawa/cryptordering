import json
import logging
import os
import time
from django.core.management.base import BaseCommand
from core.models import *
import ccxt
from enum import *

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
        order.cancel()
    
    # 自身が注文2である場合はまず注文3をキャンセル
    if position == POSITION_SETTLE_ORDER_1:
        parent = getattr(order, position)
        # OCOの場合
        if parent.special_order == ORDER_OCO:
            if not parent.order_3.cancel():
                if not order.cancel():
                    deactivate_order_relation(parent)
                    return False
                else:
                    # 自身のキャンセルに成功したらSINGLEへ
                    parent.order_1 = parent.order_3
                    parent.order_2 = None
                    parent.order_3 = None
                    parent.special_order = ORDER_SINGLE
                    parent.save()
                    return False
            else:
                # 他方のキャンセルに成功した場合はSINGLEへ
                parent.order_1 = order
                parent.order_2 = None
                parent.order_3 = None
                parent.special_order = ORDER_SINGLE
                parent.save()
                return True
        else:
            logger.error('注文の構成が不正です:{}'.format(parent.pk))
        
    # 自身が注文3である場合は注文2をキャンセル
    elif position == POSITION_SETTLE_ORDER_2:
        parent = getattr(order, position)
        if parent.special_order == ORDER_OCO:
            if not parent.order_2.cancel():
                if not order.cancel():
                    deactivate_order_relation(parent)
                    return False
                else:
                    # 自身のキャンセルに成功したらSINGLEへ
                    parent.order_1 = parent.order_2
                    parent.order_2 = None
                    parent.order_3 = None
                    parent.special_order = ORDER_SINGLE
                    parent.save()
                    return False
            else:
                # 他方のキャンセルに成功した場合はSINGLEへ
                parent.order_1 = order
                parent.order_2 = None
                parent.order_3 = None
                parent.special_order = ORDER_SINGLE
                parent.save()
                return True
        else:
            logger.error('注文の構成が不正です:{}'.format(parent.pk))

    # OCO以外の場合はTrue
    else:
        return True
      
class Command(BaseCommand):
    help = '逆指値、ストップリミット注文を出します'
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
            for market in { MARKET_BITBANK, MARKET_COINCHECK }:
                for symbol in SYMBOLS:
                    rate = Ticker.get_ticker(market, symbol)
                    if not rate:
                        continue
                    rate = rate.get('last')
                    # 有効なアラートを取得
                    alerts_by_pair = Alert.objects.filter(market = market, symbol = symbol, is_active=True)

                    for alert in alerts_by_pair:
                        if (alert.over_or_under == ALERT_THRESHOLD_OVER and rate >= alert.rate) or \
                            (alert.over_or_under == ALERT_THRESHOLD_UNDER and rate < alert.rate):
                            alert.notify_user()
                                
                    # 逆指値の注文取得
                    stop_market_orders_by_pair = Order.objects.filter(market = market, symbol = symbol, type = TYPE_STOP_MARKET, id__isnull = True, status__in = [STATUS_READY_TO_ORDER])
                    for stop_market_order in stop_market_orders_by_pair:
                        logger.info('逆指値{side}: ストップ金額={stop_price} 現在買レート={buy_rate} 現在売レート={sell_rate}'.format(side=stop_market_order.side, stop_price=stop_market_order.stop_price, buy_rate=rate, sell_rate=rate))
                        
                        if stop_market_order.is_placable(rate):    
                            parent = getattr(stop_market_order, stop_market_order.myposition)
                            # ロックされている場合は無視
                            if parent.is_locked:
                                continue
    
                            # OCOの場合は他方キャンセル
                            if cancel_oco_other_order(stop_market_order):
                                if not stop_market_order.place(True):
                                    deactivate_order_relation(parent)
                                    logger.error( '逆指値注文:{pk}の注文が失敗しました。{error}'.format(pk = stop_market_order.pk, error = stop_market_order.error_message) )
                                else:
                                    logger.info( '逆指値注文:{id}を注文しました'.format(id = stop_market_order.id) )


                    # ストップリミットの注文取得
                    stop_limit_orders_by_pair = Order.objects.filter(market = market, symbol = symbol, type = TYPE_STOP_LIMIT, id__isnull = True, status__in = [STATUS_READY_TO_ORDER])
                    for stop_limit_order in stop_limit_orders_by_pair:
                        logger.info('ストップリミット{side}: ストップ金額={stop_price} 現在買レート={buy_rate} 現在売レート={sell_rate}'.format(side=stop_limit_order.side, stop_price=stop_limit_order.stop_price, buy_rate=rate, sell_rate=rate))

                        if stop_limit_order.is_placable(rate):
                            # 親を取得
                            parent = getattr(stop_limit_order, stop_limit_order.myposition)
                            # ロックされている場合は無視
                            if parent.is_locked:
                                continue
                            
                            # OCOの場合は他方キャンセル
                            if cancel_oco_other_order(stop_limit_order):
                                if not stop_limit_order.place(True):
                                    deactivate_order_relation(parent)
                                    logger.error( 'ストップリミット注文:{pk}の注文が失敗しました。{error}'.format(pk = stop_limit_order.pk, error = stop_limit_order.error_message) )
                                else:
                                    logger.info( 'ストップリミット注文:{id}を注文しました'.format(id = stop_limit_order.id) )
                        
                
                    # トレール注文取得
                    trail_orders_by_pair = Order.objects.filter(market = market, symbol = symbol, type = TYPE_TRAIL, id__isnull = True, status__in = [STATUS_READY_TO_ORDER])
                    for trail_order in trail_orders_by_pair:
                        logger.info('トレール{side}: トレール金額={trail_price} 現在買レート={buy_rate} 現在売レート={sell_rate}'.format(side=trail_order.side , trail_price=trail_order.trail_price, buy_rate=rate, sell_rate=rate))
                        
                        parent = getattr(trail_order, trail_order.myposition)
                        # ロックされている場合は無視
                        if parent.is_locked:
                            continue
                        
                        if trail_order.is_placable(rate):
                            if cancel_oco_other_order(trail_order):
                                if not trail_order.place(True):
                                    deactivate_order_relation(parent)
                                    logger.error( 'トレール注文:{pk}の注文が失敗しました。{error}'.format(pk = stop_market_order.pk, error = trail_order.error_message ) )
                                else:
                                    logger.info( 'トレール注文:{id}を注文しました'.format(id = trail_order.id) )
                            
                      

        logger.info('completed')  
          
