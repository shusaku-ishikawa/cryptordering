// forceNumeric() plug-in implementation
jQuery.fn.forceNumeric = function () {
    return this.each(function () {
        $(this).keydown(function (e) {
            var key = e.which || e.keyCode;

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
               key == 46 || key == 45)
                return true;

            return false;
        });
    });
}

function call_assets(method, market, is_async = true) {
    return $.ajax({
        url: BASE_URL_ASSETS,
        type: (method == 'GET') ? 'GET':'POST',
        dataType: 'json',
        async: is_async,
        data: {
            method: method,
            market: market
        }
    });
}
function call_ticker(method, market, pair, is_async = true) {
    return $.ajax({
        url: BASE_URL_TICKER,
        type: (method == 'GET') ? 'GET':'POST',
        dataType: 'json',
        async: is_async,
        data: {
            method: method,
            market: market,
            pair: pair
        },
    });
}

function call_notify_if_filled(new_val) {
    return $.ajax({
        url: BASE_URL_NOTIFY_IF_FILLED,
        type: 'POST',
        dataType: 'json',
        data: {
            notify_if_filled: new_val
        }
    });
}
function call_use_alert(new_val) {
    return $.ajax({
        url: BASE_URL_USE_ALERT,
        type: 'POST',
        dataType: 'json',
        data: {
            use_alert: new_val
        }
    });
}

function call_user(method, full_name  = null, bb_api_key = null, bb_api_secret_key = null, cc_api_key = null, cc_api_secret_key = null, email_for_notice = null, notify_if_filled = null, use_alert = null) {
    return $.ajax({
        url: BASE_URL_USER,
        type: (method == 'GET') ? 'GET':'POST' ,
        dataType: 'json',
        data: {
            method: method,
            full_name: full_name,
            bb_api_key: bb_api_key,
            bb_api_secret_key: bb_api_secret_key,
            cc_api_key: cc_api_key,
            cc_api_secret_key: cc_api_secret_key,
            email_for_notice: email_for_notice,
            notify_if_filled: notify_if_filled,
            use_alert: use_alert
        }
    });
}
function call_orders(method, pk, market, pair, offset = null, limit = null, side = null, order_type = null, limit_price = null, stop_price = null, trail_width = null, amount = null) {
    return $.ajax({
        url: BASE_URL_ORDERS,
        type: (method == 'GET') ? 'GET' : 'POST',
        dataType: 'json',
        data: {
            method: method,
            offset: offset,
            limit: limit,
            market: market,
            pair: pair,
            pk: pk,
            side: side,
            order_type: order_type,
            price: limit_price,
            price_for_stop: stop_price,
            trail_width: trail_width,
            start_amount: amount
        }
    });
}
function call_relations(method, market, pair, offset = null, limit = null, special_order = null, order_1 = null, order_2 = null, order_3 = null) {
    return $.ajax({
        url: BASE_URL_RELATIONS,
        type: (method == 'GET') ? 'GET' : 'POST',
        dataType: 'json',
        data: {
            method: method,
            offset: offset,
            limit: limit,
            market: market,
            pair: pair,
            special_order: special_order,
            order_1: order_1,
            order_2: order_2,
            order_3: order_3
        }
    });
}

function call_alerts(method, pk, market, pair, offset, limit, rate, comment) {
    return $.ajax({
        url: BASE_URL_ALERTS,
        type: (method == 'GET') ? 'GET' : 'POST',
        dataType: 'json',
        data: {
            method:method,
            pk: pk,
            market: market,
            pair: pair,
            offset: offset,
            limit: limit,
            rate: rate,
            comment: comment
        }
    });
}


function call_attachment(method, pk) {
    return $.ajax({
        url: BASE_URL_ATTACHMENTS,
        type: 'POST',
        dataType: 'json',
        data : {
            method: method,
            pk: pk
        },
    });
}
function call_inquiry(method, subject, body, email, attachment_pk_list) {
    return $.ajax({
        url: BASE_URL_INQUIRY,
        type: 'POST',
        dataType: 'json',
        data: {
            subject: subject,
            body: body,
            email_for_reply: email,
            att_pk_1: (attachment_pk_list.length > 0) ? attachment_pk_list[0] : null,
            att_pk_2: (attachment_pk_list.length > 1) ? attachment_pk_list[1] : null,
            att_pk_3: (attachment_pk_list.length > 2) ? attachment_pk_list[2] : null,
        },
    });
}

function hyphen_if_null(subj) {
    if (subj == null || subj == undefined || subj == '0') {
        return '-';
    } else {
        return subj;
    }
}

function isNumberKey(evt){
    var charCode = (evt.which) ? evt.which : event.keyCode;
    return !(charCode > 31 && (charCode < 48 || charCode > 57));
}

async function init_ticker_and_asset_async() {
    return $.when(init_free_amount_json_async(), init_ticker_json_async());
}

async function init_free_amount_json_async() {
    // 10秒以内にすでに更新していたら何もしない
    if (Date.now() - free_amount_json_last_updated < 1000 * 10) {
        return;
    }
    free_amount_json_last_updated = Date.now();
    return $.when(
        call_assets('GET', 'bitbank'),
        call_assets('GET', 'coincheck')
    )
    .done(function(bbassets, ccassets) {
        if (bbassets[0]['error']) {
            set_error_message(bbassets[0]['error']);
        } else {
            bbassets[0].assets.forEach(asset => {
                free_amount_json['bitbank'][asset.asset] = asset.free_amount;
            });
        }
        if (ccassets[0]['error']) {
            set_error_message(ccassets[0]['error']);
        } else {
            Object.keys(ccassets[0]).forEach(asset_name => {
                console.log(asset_name);
                if (asset_name != 'success') {
                    free_amount_json['coincheck'][asset_name] = ccassets[0][asset_name];
                }
                
            });
        }
    })
    .fail(function() {
        set_error_message('資産の取得に失敗しました。')
    });
}

async function init_ticker_json_async() {
    // 10秒以内にすでに更新していたら何もしない
    if (Date.now() - market_price_json_last_updated < 1000 * 10) {
        return false;
    }
    
    market_price_json_last_updated = Date.now();
    
    return $.when(
        call_ticker('GET', 'bitbank', 'btc_jpy'),
        call_ticker('GET', 'bitbank', 'xrp_jpy'),
        call_ticker('GET', 'bitbank', 'ltc_btc'),
        call_ticker('GET', 'bitbank', 'eth_btc'),
        call_ticker('GET', 'bitbank', 'mona_jpy'),
        call_ticker('GET', 'bitbank', 'mona_btc'),
        call_ticker('GET', 'bitbank', 'bcc_jpy'),
        call_ticker('GET', 'bitbank', 'bcc_btc'),
        call_ticker('GET', 'coincheck', 'btc_jpy'),
    )
    .done(function(btcjpy, xrpjpy, ltcbtc, ethbtc, monajpy, monabtc, bccjpy, bccbtc, ccbtcjpy) {
        
        market_price_json['bitbank']['btc_jpy'] = btcjpy[0];  
        market_price_json['bitbank']['xrp_jpy'] = xrpjpy[0];  
        market_price_json['bitbank']['ltc_btc'] = ltcbtc[0];  
        market_price_json['bitbank']['eth_btc'] = ethbtc[0];  
        market_price_json['bitbank']['mona_jpy'] = monajpy[0];  
        market_price_json['bitbank']['mona_btc'] = monabtc[0];  
        market_price_json['bitbank']['bcc_jpy'] = bccjpy[0];  
        market_price_json['bitbank']['bcc_btc'] = bccbtc[0];  
        market_price_json['coincheck']['btc_jpy'] = ccbtcjpy[0]; 
        
    })
    .fail(function() {
        set_error_message('レートの取得に失敗しました。')
    });
 
}

function return_formatted_datetime(unixtime, date_only=false) {
    if (unixtime == 0) {
        return '-';
    }
    var date = new Date(unixtime);
    var year = date.getFullYear();
    var month = date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1):date.getMonth() + 1 ;
    var day = date.getDate() < 10 ? '0' + date.getDate():date.getDate();
    var hours = date.getHours() < 10 ? '0' + date.getHours():date.getHours();
    var minutes = date.getMinutes() < 10 ? '0' + date.getMinutes():date.getMinutes();
    var seconds = date.getSeconds() < 10 ? '0' + date.getSeconds():date.getSeconds();
    if (date_only) {
        return(year + "/" + month + "/" + day);
    }
    return(year + "/" + month + "/" + day + " " + hours + ":" + minutes + ":" + seconds);
}

function update_unit_currency(currency, unit) {
    if (currency != '') {
        $('div.pair').html(currency);
        $('div.unit').html(unit);
    }
}
function convert_iso_datetime(original, date_only = false) {
    var date = new Date(Date.parse(original));
    var year = date.getFullYear();
    var month = date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1):date.getMonth() + 1 ;
    var day = date.getDate() < 10 ? '0' + date.getDate():date.getDate();
    var hours = date.getHours() < 10 ? '0' + date.getHours():date.getHours();
    var minutes = date.getMinutes() < 10 ? '0' + date.getMinutes():date.getMinutes();
    var seconds = date.getSeconds() < 10 ? '0' + date.getSeconds():date.getSeconds();
    if (date_only) {
        return(year + "/" + month + "/" + day);
    }
    return(year + "/" + month + "/" + day + " " + hours + ":" + minutes + ":" + seconds);
}

function readURL(file, target_img) {
    if (file) {
        var reader = new FileReader();

        reader.onload = function (e) {
            $(target_img).attr('src', e.target.result);
        };

        reader.readAsDataURL(file);
    }
}
function set_error_message(message="ログインし直してください") {
    var $modal = $('.modal');
    $modal.find('span#message').html(message);
    $modal.find('.alert-icon').show();
    $modal.find('.success-icon').hide();
    
    $modal.modal('show');
}

function set_success_message(message="正常に処理しました") {
    var $modal = $('.modal');
    $modal.find('span#message').html(message);
    $modal.find('.success-icon').show();
    $modal.find('.alert-icon').hide();
    
    $modal.modal('show');
}

function set_info_message(message) {
    var $modal = $('.modal');
    $modal.find('span#message').html(message);
    $modal.find('.success-icon').hide();
    $modal.find('.alert-icon').hide();
    
    $modal.modal('show');
}


function handle_error(error) {
    const { status, statusText, responseText } = error;
    if (status == 401) {
        window.location.href = BASE_URL_LOGIN;
    }
    set_error_message(statusText);
}


