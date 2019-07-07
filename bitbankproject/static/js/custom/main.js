COUNT_PER_PAGE = 10;

COOKIE_ORDER_MARKET = "ck_order_market"

COOKIE_ORDER_PAIR_BB = "ck_order_pair_bb";
COOKIE_SPECIAL_ORDER_BB = "ck_special_order_bb";

COOKIE_ORDER_PAIR_CC = "ck_order_pair_cc";
COOKIE_SPECIAL_ORDER_CC = "ck_special_order_cc";



COOKIE_ALERT_PAIR = "ck_alert_pair";
COOKIE_ALERT_MARKET = "ck_alert_market";
COOKIE_SEARCH_PAIR_ALERTS = "ck_search_pair_alerts";
COOKIE_SEARCH_PAIR_ACTIVE_ORDERS = "ck_search_pair_ao";
COOKIE_SEARCH_PAIR_ORDER_HISTORY = "ck_search_pair_oh";
COOKIE_LAST_VISITED_TAB = "ck_last_visited_tab";


MARKETS = {
    "bitbank": "bitbank",
    "coincheck": "coincheck"
}

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
SPECIAL_ORDERS = {
    'SINGLE': 'SINGLE',
    'IFD': 'IFD',
    'OCO': 'OCO',
    'IFDOCO': 'IFDOCO'  
};

ORDER_SEQ = {
    'order_1': '新規注文',
    'order_2': '決済注文1',
    'order_3': '決済注文2'
}
ORDER_TYPES = {
    'market': '成行',
    'limit': '指値',
    'stop_market': '逆指値',
    'stop_limit': 'ストップリミット',
    'trail': 'トレール'
};

SELL_BUY = {
    'sell': '売',
    'buy' : '買'
}

RATE_UPDATE_FREQ = 11000;

var free_amount_json_last_updated = 0;
var free_amount_json = {
    'bitbank': {},
    'coincheck': {}
};
var market_price_json_last_updated = 0
var market_price_json = {
    'bitbank': {},
    'coincheck': {'btc_jpy':{}}
};

function openTab(evt, tab_id) {

    $('#id_ajax_message').hide();
    $('#id_order_result_message').hide();
    $('#id_contact_message').hide();
    $.cookie(COOKIE_LAST_VISITED_TAB, tab_id, {expire: 7});
    switch( tab_id ) {
        case 'order':
            init_order_tab(false);
            break;
        case 'active_orders':
            init_active_orders_tab(false);
            break;
        case 'order_history':
            init_order_history_tab(false);
            break;
        case 'alerts':
            init_alerts_tab(false);
            break;
        case 'assets':
            init_asset_tab(false);
            break;
        case 'user_info':
            init_user_info_tab(false);
            break;
        case 'contact':
            init_contact_tab(false);
            break;
    }

    // Get all elements with class="tabcontent" and hide them
    $('.tabcontent').each((i, tabcontent) => {
        $(tabcontent).hide();
    });


    // Get all elements with class="tablinks" and remove the class "active"
    $('.tablinks').each((i, tablink) => {
        $(tablink).removeClass('active');
    });

    // Show the current tab, and add an "active" class to the button that opened the tab
    $('#' + tab_id).show();
    evt.target.className += " active";
}



//資産情報取得用

$(function() {

    init_ticker_and_asset_async()
    .then(function() {
        init_order_tab(true);
        init_active_orders_tab(true);
        init_order_history_tab(true);
        init_alerts_tab(true);
        init_asset_tab(true);
        init_user_info_tab(true);
        init_contact_tab(true);
        $('#order_button').click();
    });
    setInterval(async () => {
        await init_ticker_and_asset_async()}, RATE_UPDATE_FREQ
    );
    var $number_inputs = $('input[type="number"]');
    $number_inputs.blur(function(){ if ( !isNumeric($(this).val()) ) { $(this).focus(); } });
});


function isNumeric(value) {
    if ( value == null )
    return;
    if(!value.match( /([0-9]*[.])?[0-9]*/ ) ) {
        set_error_message("半角数字で入力して下さい。");
        return false;
    }
    return true;
}

    
// forceNumeric() plug-in implementation
jQuery.fn.forceNumeric = function () {
    return this.each(function () {
        $(this).keydown(function (e) {
            var key = e.which || e.keyCode;
            console.log(key);
            if (!e.shiftKey && !e.altKey && !e.ctrlKey &&
            // numbers   
                key >= 48 && key <= 57 ||
            // Numeric keypad
                key >= 96 && key <= 105 ||
            // comma, period and minus, . on keypad
               key == 190 || key == 188 || key == 109 || key == 110 ||
            // Backspace and Tab and Enter
               key == 8 || key == 9 || key == 13 ||
            // Home and End
               key == 35 || key == 36 ||
            // left and right arrows
               key == 37 || key == 39 ||
            // Del and Ins
               key == 46 || key == 45 ||
            // v and c
               key == 67 || key == 86)
                return true;

            return false;
        });
    });
}
// １００