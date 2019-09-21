MARKET_BITBANK = 'bitbank'
MARKET_COINCHECK = 'coincheck'

ORDER_SINGLE = 'SINGLE'
ORDER_IFD = 'IFD'
ORDER_OCO = 'OCO'
ORDER_IFDOCO = 'IFDOCO'

SIDE_BUY = 'buy'
SIDE_SELL = 'sell'


TYPE_MARKET = 'market'
TYPE_LIMIT = 'limit'
TYPE_STOP_MARKET = 'stop_market'
TYPE_STOP_LIMIT = 'stop_limit'
TYPE_TRAIL = 'trail'

STATUS_UNFILLED = 'open'
STATUS_PARTIALLY_FILLED = 'PARTIALLY_FILLED'
STATUS_FULLY_FILLED = 'closed'
STATUS_CANCELED_UNFILLED = 'CANCELED_UNFILLED'
STATUS_CANCELED_PARTIALLY_FILLED = 'CANCELED_PARTIALLY_FILLED'
STATUS_READY_TO_ORDER = 'READY_TO_ORDER'
STATUS_WAIT_OTHER_ORDER_TO_FILL = "WAIT_OTHER_ORDER_TO_FILL"
STATUS_FAILED_TO_ORDER = 'FAILED_TO_ORDER'

POSITION_NEW_ORDER = 'new_order'
POSITION_SETTLE_ORDER_1 = 'settle_order_1'
POSITION_SETTLE_ORDER_2 = 'settle_order_2'

ALERT_THRESHOLD_OVER = 'over'
ALERT_THRESHOLD_UNDER = 'under'

SYMBOLS = {
    'BTC/JPY',
    'XRP/JPY',
    'LTC/BTC',
    'ETH/BTC',
    'MONA/JPY',
    'MONA/BTC',
    'BCH/JPY',
    'BCH/BTC'
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

BITBANK_ERROR_CODES = {
    '10000':'URLが存在しません',
    '10001':'システムエラーが発生しました。サポートにお問い合わせ下さい',
    '10002':'不正なJSON形式です。送信内容をご確認下さい',
    '10003':'システムエラーが発生しました。サポートにお問い合わせ下さい',
    '10005':'タイムアウトエラーが発生しました。しばらく間をおいて再度実行して下さい',
    '20001':'API認証に失敗しました',
    '20002':'APIキーが不正です',
    '20003':'APIキーが存在しません',
    '20004':'API Nonceが存在しません',
    '20005':'APIシグネチャが存在しません',
    '20011':'２段階認証に失敗しました',
    '20014':'SMS認証に失敗しました',
    '30001':'注文数量を指定して下さい',
    '30006':'注文IDを指定して下さい',
    '30007':'注文ID配列を指定して下さい',
    '30009':'銘柄を指定して下さい',
    '30012':'注文価格を指定して下さい',
    '30013':'売買どちらかを指定して下さい',
    '30015':'注文タイプを指定して下さい',
    '30016':'アセット名を指定して下さい',
    '30019':'uuidを指定して下さい',
    '30039':'出金額を指定して下さい',
    '40001':'注文数量が不正です',
    '40006':'count値が不正です',
    '40007':'終了時期が不正です',
    '40008':'end_id値が不正です',
    '40009':'from_id値が不正です',
    '40013':'注文IDが不正です',
    '40014':'注文ID配列が不正です',
    '40015':'指定された注文が多すぎます',
    '40017':'銘柄名が不正です',
    '40020':'注文価格が不正です',
    '40021':'売買区分が不正です',
    '40022':'開始時期が不正です',
    '40024':'注文タイプが不正です',
    '40025':'アセット名が不正です',
    '40028':'uuidが不正です',
    '40048':'出金額が不正です',
    '50003':'現在、このアカウントはご指定の操作を実行できない状態となっております。サポートにお問い合わせ下さい',
    '50004':'現在、このアカウントは仮登録の状態となっております。アカウント登録完了後、再度お試し下さい',
    '50005':'現在、このアカウントはロックされております。サポートにお問い合わせ下さい',
    '50006':'現在、このアカウントはロックされております。サポートにお問い合わせ下さい',
    '50008':'ユーザの本人確認が完了していません',
    '50009':'ご指定の注文は存在しません',
    '50010':'ご指定の注文はキャンセルできません',
    '50011':'APIが見つかりません',
    '50026':'ご指定の注文は既にキャンセル済みです',
    '50027':'ご指定の注文は既に約定済みです',
    '60001':'保有数量が不足しています',
    '60002':'成行買い注文の数量上限を上回っています',
    '60003':'指定した数量が制限を超えています',
    '60004':'指定した数量がしきい値を下回っています',
    '60005':'指定した価格が上限を上回っています',
    '60006':'指定した価格が下限を下回っています',
    '60011':'同時発注制限件数(30件)を上回っています',
    '70001':'システムエラーが発生しました。サポートにお問い合わせ下さい',
    '70002':'システムエラーが発生しました。サポートにお問い合わせ下さい',
    '70003':'システムエラーが発生しました。サポートにお問い合わせ下さい',
    '70004':'現在取引停止中のため、注文を承ることができません',
    '70005':'現在買注文停止中のため、注文を承ることができません',
    '70006':'現在売注文停止中のため、注文を承ることができません',
    '70009':'ただいま成行注文を一時的に制限しています。指値注文をご利用ください。',
    '70010':'ただいまシステム負荷が高まっているため、最小注文数量を一時的に引き上げています。',
    '70011':'ただいまリクエストが混雑してます。しばらく時間を空けてから再度リクエストをお願いします'
}
