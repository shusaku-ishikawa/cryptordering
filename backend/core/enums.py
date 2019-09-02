MARKET_BITBANK = 'bitbank'
MARKET_COINCHECK = 'coincheck'

SIDE_BUY = 'buy'
SIDE_SELL = 'sell'

TYPE_MARKET = 'market'
TYPE_LIMIT = 'limit'
TYPE_STOP_MARKET = 'stop_market'
TYPE_STOP_LIMIT = 'stop_limit'
TYPE_TRAIL = 'trail'

STATUS_UNFILLED = 'UNFILLED'
STATUS_PARTIALLY_FILLED = 'PARTIALLY_FILLED'
STATUS_FULLY_FILLED = 'FULLY_FILLED'
STATUS_CANCELED_UNFILLED = 'CANCELED_UNFILLED'
STATUS_CANCELED_PARTIALLY_FILLED = 'CANCELED_PARTIALLY_FILLED'
STATUS_READY_TO_ORDER = 'READY_TO_ORDER'
STATUS_WAIT_OTHER_ORDER_TO_FILL = "WAIT_OTHER_ORDER_TO_FILL"
STATUS_FAILED_TO_ORDER = 'FAILED_TO_ORDER'

PAIRS = {
    'btc_jpy': 'BTC/JPY',
    'xrp_jpy': 'XRP/JPY',
    'ltc_btc': 'LTC/BTC',
    'eth_btc': 'ETH/BTC',
    'mona_jpy': 'MONA/JPY',
    'mona_btc': 'MONA/BTC',
    'bcc_jpy': 'BCC/JPY',
    'bcc_btc': 'BCC/BTC'
}

STATUS = {
    'UNFILLED': '未約定',
    'PARTIALLY_FILLED': '一部約定済',
    'FULLY_FILLED': '約定済',
    'CANCELED_UNFILLED': 'キャンセル済',
    'CANCELED_PARTIALLY_FILLED': '一部キャンセル済',
    'READY_TO_ORDER': '未注文',
    'FAILED_TO_ORDER': '注文失敗',
    'WAIT_OTHER_ORDER_TO_FILL': '他注文約定待'
}
ORDER_TYPES = {
    'market': '成行',
    'limit': '指値',
    'stop_market': '逆指値',
    'stop_limit': 'ストップリミット',
    'trail': 'トレール',
    '-': '不明'
}

