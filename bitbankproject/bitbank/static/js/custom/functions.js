var free_amount_json = {
    'bitbank': {},
    'coincheck': {}
};
var market_price_json = {
    'bitbank': {},
    'coincheck': {'btc_jpy':{}}
};

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

function call_orders(method, market, pair, offset = null, limit = null, type = null, pk = null, special_order = null, order_1 = null, order_2 = null, order_3 = null) {
    return $.ajax({
        url: BASE_URL_ORDERS,
        type: (method == 'GET') ? 'GET' : 'POST',
        dataType: 'json',
        data: {
            method: method,
            offset: offset,
            limit: limit,
            market: market,
            type: type,
            pk: pk,
            pair: pair,
            special_order: special_order,
            order_1: order_1,
            order_2: order_2,
            order_3: order_3
        }
    });
}

function call_alerts(method, pk, market, pair, offset, limit, rate) {
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

function init_free_amount_json($message_target) {
    Object.keys(MARKETS).forEach(market => {
        if (market == 'bitbank') {
            call_assets('GET', market)
            .done(function(res) {
                if (res.error) {
                    set_error_message($message_target, res.error);
                    return;
                }
                res.assets.forEach(asset => {
                    free_amount_json[market][asset.asset] = asset.free_amount;
                });
            })
            .fail(function(data, textStatus, xhr) {
                if (data.status == 401) {
                    window.location.href = BASE_URL_LOGIN;
                }
                
                set_error_message($message_target, xhr);
            });
        } else {
            call_assets('GET', market)
            .done(function(res) {
                if (res.error) {
                    console.log(res);
                    set_error_message($message_target, res.error);
                    return;
                }
                free_amount_json[market]['btc'] = res.btc;
                free_amount_json[market]['jpy'] = res.jpy;
            })
            .fail(function(data, textStatus, xhr) {
                if (data.status == 401) {
                    window.location.href = BASE_URL_LOGIN;
                }
                
                set_error_message($message_target, xhr);
            });
        }
        
    });
}

function init_ticker_json($message_target) {
    
    Object.keys(PAIRS).forEach(pair => {
        call_ticker('GET', 'bitbank', pair)
        .done(function (res) {
            if (res.error) {
                set_error_message($message_target , res.error);
                return;
            }
            market_price_json['bitbank'][pair] = res;              
        })
        .fail(function(data, textStatus, xhr) {
            if (data.status == 401) {
                window.location.href = BASE_URL_LOGIN;
            }
            set_error_message($message_target, xhr);
        });
    });
    call_ticker('GET', 'coincheck', 'btc_jpy')
    .done(function (res) {
        if (res.error) {
            console.log(res);
            set_error_message($message_target , res.error);
            return;
        }
        //console.log(res);
        market_price_json['coincheck']['btc_jpy']['buy'] = res.ask;
        market_price_json['coincheck']['btc_jpy']['sell'] = res.bid;
                      
    })
    .fail(function(data, textStatus, xhr) {
        if (data.status == 401) {
            window.location.href = BASE_URL_LOGIN;
        }
        set_error_message($message_target, xhr);
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


function display_price_div(tab_num, order_type) {
    switch (order_type) {
        case 'market':
            $('.show_if_stop_order_' + tab_num).hide();
            $('.show_if_limit_order_' + tab_num).hide();
            $('.show_if_trail_' + tab_num).hide();
            
            break;
        case 'limit':
            $('.show_if_stop_order_' + tab_num).hide();
            $('.show_if_limit_order_' + tab_num).show();
            $('.show_if_trail_' + tab_num).hide();
            break;
        case 'stop_market':
            $('.show_if_stop_order_' + tab_num).show();
            $('.show_if_limit_order_' + tab_num).hide();
            $('.show_if_trail_' + tab_num).hide();
            break;
        case 'stop_limit':
            $('.show_if_stop_order_' + tab_num).show();
            $('.show_if_limit_order_' + tab_num).show();
            $('.show_if_trail_' + tab_num).hide();
            break;
        case 'trail':
            $('.show_if_stop_order_' + tab_num).hide();
            $('.show_if_limit_order_' + tab_num).hide();
            $('.show_if_trail_' + tab_num).show();
            break;
    }
}

function update_amount_by_slider(tab_num) {
    var $perc = $('#amount_percentage_' + tab_num);
    var $amount = $('#id_start_amount_' + tab_num);
    var newVal = parseInt($('#myRange_' + tab_num).val());
    var market = $('#id_market').val();
    var pair = $('#id_pair').val();
    var side = $('#id_side_' + tab_num).val();
    var limitprice = parseFloat($('#id_price_' + tab_num).val());
    var stopprice = parseFloat($('#id_price_for_stop_' + tab_num).val());
    var order_type = $('#id_order_type_' + tab_num).val();
    var currency = (side == 'sell') ? pair.split('_')[0] : pair.split('_')[1];

    $perc.html(newVal + '%');


    if (newVal != 0) {
        var free_amount = parseFloat(free_amount_json[market][currency]);
        console.log('before ' + free_amount);
        if (tab_num == 2 || tab_num == 3) {
            var if_done_order_type = $('#id_order_type_1').val();
            var if_done_amount = parseFloat($('#id_start_amount_1').val());
            var if_done_side = $('#id_side_1').val();
            // 新規注文数が入力されている場合
            if (!isNaN(if_done_amount)) {
                if (if_done_side == 'buy') {
                    free_amount -= (side == 'buy') ? if_done_amount * market_price_json[market][pair]['buy'] : -if_done_amount;
                } else {
                    free_amount += (side == 'buy') ? if_done_amount * market_price_json[market][pair]['buy'] : -if_done_amount;
                }
            }
            console.log('after ' + free_amount);
        }
        
        var price = (order_type.match(/limit/)) ? (limitprice != '') ? limitprice : 0 : (order_type.match(/stop/)) ? stopprice : market_price_json[market][pair][side];
        console.log(price);
        var floored = (side == 'sell') ? Math.floor((parseFloat(free_amount) * newVal / 100) * 10000) / 10000 : (price != 0) ? Math.floor((free_amount * newVal / (price * 100)) * 10000) / 10000 : 0;
        
        if (isNaN(floored)) {
            $perc.html('資金不足');
        } else {
            $amount.val(floored).trigger('calculate');
        }
    } else {
        $amount.val(0).trigger('calculate');
    }
}

function update_slider_by_amount(tab_num) {

    var market = $('#id_market').val();
    var pair = $('#id_pair').val();
    var side = $('#id_side_' + tab_num).val();
    var order_type = $('#id_order_type_' + tab_num).val(); 
    var price = $('#id_price_' + tab_num).val();
    var amount = $('#id_start_amount_' + tab_num).val();
    var $input_expect_price = $('#expect_price_' + tab_num);
    var $percentage = $('#amount_percentage_' + tab_num);

    if (side == 'buy') {
        var currency = pair.split('_')[1];
    } else {
        var currency = pair.split('_')[0];
    }

    // limit orderの場合
    if (order_type.match(/limit/)) {
        var new_price = price;
    } else {
        var new_price = market_price_json[market][pair][side];
    }

    if (amount == '' || amount == 0 || amount == '' || amount == 0) {
        set_slidevalue(tab_num, 0, false);
    } else {
        if (side == 'buy') {
            var perc = new_price * amount * 100 / parseFloat(free_amount_json[market][currency]);
        } else {
            var perc = amount * 100 / parseFloat(free_amount_json[market][currency]);   
        }
        
        if (perc > 100.0) {
            $percentage.html('資金不足');
        } else {
            var rounded = Math.round(perc * 10) / 10;
            set_slidevalue(tab_num, rounded, false);
            if (currency == 'jpy') {
                $input_expect_price.val(Math.round(new_price * amount));
            } else {
                $input_expect_price.val(Math.round(new_price * amount * 10000) / 10000);
            } 
        }
    }
}


function calculate_expect_price(tab_num) {
    var market = $('#id_market').val();
    var pair = $('#id_pair').val();
    var side = $('#id_side_' + tab_num).val();
    var order_type = $('#id_order_type_' + tab_num).val();
    var amount = $('#id_start_amount_' + tab_num).val();
    var $input_price = $('#id_price_' + tab_num);
    var $input_expect_price = $('#expect_price_' + tab_num);


    if (parseFloat(amount) == 0 || amount == '') {
        $input_expect_price.val(null);
    } else {
        var price = (order_type.match(/market/)) ? parseFloat(market_price_json[market][pair][side]) : ($input_price.val() != '') ? parseFloat($input_price.val()) : 0;
        if (pair.split('_')[1] == 'jpy') {
            $input_expect_price.val(Math.floor(price * amount));    
        } else {
            $input_expect_price.val(price * amount);    
        }
    }
}
function create_order_json(market, pair, side, order_type, price, price_for_stop, trail_width, start_amount) {
    var order_info = new Object();
    order_info.market = market
    order_info.pair = pair;
    order_info.side = side;
    order_info.order_type = order_type;
    order_info.price = order_type.match(/limit/) ? price : null;
    order_info.price_for_stop = order_type.match(/stop/) ? price_for_stop : null;
    order_info.trail_width = order_type.match(/trail/) ? trail_width : null;
    order_info.start_amount = start_amount;
    return JSON.stringify(order_info);
}
function _order(market, pair, special_order, order_1, order_2, order_3,  $message_target) {
    $order_button = $('#id_order_button');

    call_orders('POST', market, pair, null, null, null, null, special_order, order_1, order_2, order_3)
    .done(function(res) {
        //console.log(res);
        if (res.error) {
            set_error_message($message_target, res.error);
            return;
        }
        set_success_message($message_target, '注文が完了しました');
    })
    .fail(function(data, textStatus, xhr) {
        if (data.status == 401) {
            window.location.href = BASE_URL_LOGIN;
        }
        set_error_message($message_target, xhr);
    })
    .always(() => {
        $order_button.prop('disabled', false);
    });
}
function get_confirmation(order_name) {
    $.confirm({
        title: '<span style="color:black>確認</span>',
        content: '<span style="color:black">' + order_name + 'は確定後すぐに約定しますがこの価格でよろしいですか？</span>',
        type: 'red',
        buttons: {
            confirm: {
                text: 'はい',
                btnClass: 'green_button',
                
                action: function () {
                    return true;
                }
            },
            cancel:{
                text: 'いいえ',
                btnClass: 'red_button',
                action: function () {
                    return false;
                },
            }
        }
    });
}
function place_order(market, pair, special_order, order_1, order_2, order_3,  $message_target) {
    
    call_ticker('GET', market, pair)
    .done(function(res) {
        if (res.error) {
            set_error_message($message_target, res.error);
            return;
        }
            
        if (order_1 != null && order_1.order_type == 'limit') {
            if ((order_1.side == 'buy' && parseFloat(res.buy) < order_1.price) || (order_1.side  == 'sell' && parseFloat(res.sell) > order_1.price)){
                if (!get_confirmation('新規注文')) {
                    return;
                }
            }
        }
        if (order_1 == null && order_2.order_type == 'limit') {
            if ((order_2.side == 'buy' && parseFloat(res.buy) < order_2.price) || (order_2.side  == 'sell' && parseFloat(res.sell) > order_2.price)){
                if (!get_confirmation('決済注文1')) {
                    return;
                }
            }
        } 
        if (order_1 == null && order_3.order_type == 'limit') {
            if ((order_3.side == 'buy' && parseFloat(res.buy) < order_3.price) || (order_3.side  == 'sell' && parseFloat(res.sell) > order_3.price)){
                if (!get_confirmation('決済注文2')) {
                    return;
                }
            }
        } 
        _order(market, pair, special_order, order_1, order_2, order_3,  $message_target);
    })
    .fail(function(data, textStatus, xhr) {
    
        if (data.status == 401) {
            window.location.href = BASE_URL_LOGIN;
        }
        set_error_message($message_target, xhr);
    });            
}
function set_slidevalue(tab_num, new_val, trigger_input_event=true) {
    var tar = $('#myRange_' + tab_num);
    if (trigger_input_event) {
        tar.val(new_val).trigger('input');
    } else {
        tar.val(new_val);
    }
    
    var ini = (tar.val() - tar.attr('min')) / (tar.attr('max') - tar.attr('min'));
    tar.css('background-image',
            '-webkit-gradient(linear, left top, right top, '
            + 'color-stop(' + ini + ', ' + ($('#id_side_' + tab_num).val() == 'buy' ? 'teal' : 'orangered') + '), '
            + 'color-stop(' + ini + ', #333333)'
            + ')'
    );
    $('#amount_percentage_' + tab_num).html(new_val + '%');
}

function set_default_price(tab_num, market, pair, $message_target, called_at = null) {
    //console.log(called_at);
    call_ticker('GET', market, pair)
    .done(function(res) {
        if (res.error) {
            set_error_message($message_target, res.error);
            return;
        }
        //consoleconsole.log(res);
        var new_order_type = $('#id_order_type_' + tab_num).val();
        if (new_order_type != 'market') {
            $('#id_price_' + tab_num).val(res.last);
            $('#id_price_for_stop_' + tab_num).val(res.last);
        }
    })
    .fail(function(data, textStatus, xhr) {
        if (data.status == 401) {
            window.location.href = BASE_URL_LOGIN;
        }
        //alert('call ticker erorr');
        set_error_message($message_target, xhr);
    });
}
function reset_input(i) {
    $('#id_trail_width_' + i).val(null);
    $('#id_price_' + i).val(null);
    $('#id_price_for_stop_' + i).val(null);
    $('#id_start_amount_' + i).val(null);
    $('#expect_price_' + i).val(null);
    set_slidevalue(i, 0, false);
}
function reset_input_all() {

    for (let i = 1; i < 4; i++) {
        set_slidevalue(i, 0, false);
        $('#id_side_' + i).val(Object.keys(SELL_BUY)[1]).trigger('value_change');
        $('#id_order_type_' + i).val(Object.keys(ORDER_TYPES)[1]).trigger('change');
        //set_default_price(i, market, pair, $message_target, 'reset_all');
    }
}

function update_unit_currency(currency, unit) {
    if (currency != '') {
        $('div.pair').html(currency);
        $('div.unit').html(unit);
    }
}

function init_order_tab(is_initial = false) {
    var $order_result_message_target = $('#id_order_result_message');
    var $ajax_message_target = $('#id_ajax_message');
    init_ticker_json($ajax_message_target);
    init_free_amount_json($ajax_message_target);

    for (let i = 1; i < 4; i ++) {
        if ($('#id_side_' + i).val() == 'sell') {
            $('#sell_button_' + i).addClass('sell').removeClass('btn-base');
            $('#buy_button_' + i).removeClass('buy').addClass('btn-base');
        } else {
            $('#buy_button_' + i).addClass('buy').removeClass('btn-base');
            $('#sell_button_' + i).removeClass('sell').addClass('btn-base');
        }
    }
    

    //画面ロード時のみ
    if (is_initial) {
        var $input_pair = $('#id_pair');
        var $input_special_order = $('#id_special_order');
        var $button_order = $('#id_order_button');
        var $input_number = $('input[type="number"]');
        var $slick = $('#slider_contents');
        
        // bitbank/coincheck start
        var $bitbank_button = $('#id_bitbank');
        var $coincheck_button = $('#id_coincheck');
        var $input_market = $('#id_market');
        // bitbank/coincheck end
      
        
        $slick
        .slick({
            swipe: false,
            touchMove: false,
            prevArrow: false,
            nextArrow: false,
            dots: true,
            appendDots: $('#id_dots_area')
        });
        
        Object.keys(MARKETS).forEach(key => {
            $('<option>', {
                value: key,
                text: MARKETS[key],
            }).appendTo($input_market);
        });

        Object.keys(PAIRS).forEach(key => {
            $('<option>', {
                value: key,
                text: PAIRS[key],
            }).appendTo($input_pair);
        });

        Object.keys(SPECIAL_ORDERS).forEach(key => {
            $('<option>', {
                value: key,
                text: SPECIAL_ORDERS[key],
            }).appendTo($input_special_order);
        });
        
 
        $input_market
        .on('value_change', function() {
            $.cookie(COOKIE_ORDER_MARKET, $(this).val(), { expires: 7 });
            
            reset_input_all();
            if ($(this).val() == 'bitbank') {
                $('.show_if_coincheck').hide();

                $bitbank_button.addClass('active');
                $coincheck_button.removeClass('active');
                $input_pair
                .empty()
                .removeClass('onlyone');
                Object.keys(PAIRS).forEach(key => {
                    $('<option>', {
                        value: key,
                        text: PAIRS[key],
                    }).appendTo($input_pair);
                });

            } else {
                $('.show_if_coincheck').show();
                $bitbank_button.removeClass('active');
                $coincheck_button.addClass('active');
                $input_pair
                .empty()
                .append($('<option>', {
                    value: 'btc_jpy',
                    text: PAIRS['btc_jpy'],
                    readonly: true
                }));
                $input_pair.addClass('onlyone');
                var unit = $input_pair.val().split('_')[0].toUpperCase();
                var currency = $input_pair.val().split('_')[1].toUpperCase();
                update_unit_currency(currency, unit);
            }
        });
        $bitbank_button
        .on('click', function() {
            // 変更があった場合のみ処理
            if ($input_market.val() == 'coincheck') {
                $input_market.val('bitbank').trigger('value_change');
            } else {
                // do nothing  
            }
        });
        $coincheck_button
        .on('click', function() {
            // 変更があった場合のみ処理
            if ($input_market.val() == 'bitbank') {
                $input_market.val('coincheck').trigger('value_change');
            } else {
                // do nothing
            }
        });
        $input_special_order
        .on('change', function() {
            $.cookie(COOKIE_SPECIAL_ORDER, $(this).val(), { expires: 7 });
               
            $slick
            .slick('slickUnfilter')
            .slick('slickFilter', function(index){
                switch ($('#id_special_order').val()) {
                    case 'SINGLE':
                        if (index == 0){
                            return $(this).eq(index);  
                        }
                        break;
                    case 'IFD':
                        if (index < 2){
                            return $(this).eq(index);  // スライド番号が2より小さいものだけ表示
                        }
                        break;
                    case 'OCO':
                        if (index > 0){
                            return $(this).eq(index);  // スライド番号が2より小さいものだけ表示
                        }
                        break;
                    case 'IFDOCO':
                        return $(this).eq(index);  // スライド番号が2より小さいものだけ表示
                        break;
                }   
            });

            $slick.slick('slickGoTo', 0);
            reset_input_all(); 
        });

        $input_pair.on('change', function() {
            $.cookie(COOKIE_ORDER_PAIR, $(this).val(), { expires: 7 });

            reset_input_all();    
            
            // 数量、金額の通貨部分を更新
            var unit = $(this).val().split('_')[0].toUpperCase();
            var currency = $(this).val().split('_')[1].toUpperCase();
            update_unit_currency(currency, unit);
            
            $slick.slick('slickGoTo', 0);
        });
        

        for (let i = 1; i < 4; i++) {
            
            $('#myRange_' + i).on("input", function () {
                update_amount_by_slider(i);
                var val = ($(this).val() - $(this).attr('min')) / ($(this).attr('max') - $(this).attr('min'));
                $(this).css('background-image',
                    '-webkit-gradient(linear, left top, right top, '
                    + 'color-stop(' + val + ', ' + ($('#id_side_' + i).val() == 'buy' ? 'teal' : 'orangered') + '),'
                    + 'color-stop(' + val + ', #333333)'
                    + ')'
                );
            });

            $('#id_start_amount_' + i)
            .on('change', function() {
                update_slider_by_amount(i);
            })
            .on('calculate', function() {
                calculate_expect_price(i);
            });

            $('#id_start_amount_' + i)
            .on('change', function() {
                update_slider_by_amount(i);
            });

            $('#id_order_type_' + i)
            .on('change', function() {
                reset_input(i);
                var new_order_type = $(this).val();
                if (new_order_type == 'limit') {
                    $('#id_price_placeholder_' + i).html('指値価格');
                } else if (new_order_type == 'stop_market') {
                    $('#id_stop_price_placeholder_' + i).html('逆指値価格');
                } else if (new_order_type == 'stop_limit') {
                    $('#id_stop_price_placeholder_' + i).html('逆指値(発動価格)');
                    $('#id_price_placeholder_' + i).html('指値(約定希望価格)');
                }
                if (new_order_type != 'market') {
                    set_default_price(i, $input_market.val(), $input_pair.val(), $ajax_message_target, 'order_type_change_' + i);
                }
                
                display_price_div(i, new_order_type);
            });

            $('#id_side_' + i)
            .on('value_change', function() {
                reset_input(i);
                if ($(this).val() == 'buy') {
                    $('#sell_button_' + i).removeClass('sell').addClass('btn-base');
                    $('#buy_button_' + i).addClass('buy').removeClass('btn-base');
                    $('#myRange_' + i).addClass('slider_for_buy').removeClass('slider_for_sell');
                    $('button[name="perc_button_' + i + '"]').addClass('buy').removeClass('sell');
                    
                    $button_order.addClass('green_button').removeClass('red_button');
                } else {
                    
                    $('#sell_button_' + i).addClass('sell').removeClass('btn-base');
                    $('#buy_button_' + i).removeClass('buy').addClass('btn-base');
                    $('#myRange_' + i).addClass('slider_for_sell').removeClass('slider_for_buy');
                    $button_order.removeClass('green_button').addClass('red_button');
                    $('button[name="perc_button_' + i + '"]').addClass('sell').removeClass('buy');
                }
              
                set_default_price(i, $input_market.val(), $input_pair.val(), $ajax_message_target, 'side change_' + i);
            });
            $('#sell_button_' + i).on('click', function() {
                // 変更があった場合のみ処理
                if ($('#id_side_' + i).val() == 'buy') {
                    $('#id_side_' + i).val('sell').trigger('value_change');
                    $button_order.removeClass('green_button').addClass('red_button'); 
                } else {
                    // do nothin  
                }
            });
            $('#buy_button_' + i).on('click', function() {
                // 変更があった場合のみ処理
                if ($('#id_side_' + i).val() == 'sell') {
                    $('#id_side_' + i).val('buy').trigger('value_change');
                    $button_order.removeClass('red_button').addClass('green_button');
                } else {
                   // do nothing
                }
            });
            
            $('button[name="perc_button_' + i + '"]')
            .on('click', function() {
                $('#myRange_' + i).val($(this).val()).trigger('input');
            });

            Object.keys(SELL_BUY).forEach(key => {
                $('<option>', {
                    value: key,
                    text: SELL_BUY[key],
                }).appendTo($('#id_side_' + i));
            });
    
            Object.keys(ORDER_TYPES).forEach(key => {
                $('<option>', {
                    value: key,
                    text: ORDER_TYPES[key],
                }).appendTo($('#id_order_type_' + i));
            });

        }
        
        var ck_market = $.cookie(COOKIE_ORDER_MARKET);
        if (ck_market != undefined && Object.keys(MARKETS).indexOf(ck_market) >= 0) {
           // alert(ck_market);
            $input_market.val(ck_market).trigger('value_change');
        } else {
            // 無ければ先頭の選択肢をセット
            $input_market.val(Object.keys(MARKETS)[0]).trigger('value_change');
        }

        // クッキーにあればデフォルトセット
        var ck_pair = $.cookie(COOKIE_ORDER_PAIR);
        if (ck_pair != undefined && Object.keys(PAIRS).indexOf(ck_pair) >= 0) {
            $input_pair.val(ck_pair).trigger('change');
        } else {
            // 無ければ先頭の選択肢をセット
            $input_pair.val(Object.keys(PAIRS)[0]).trigger('change');
        }
                
        var ck_special_order = $.cookie(COOKIE_SPECIAL_ORDER);
        if (ck_special_order != undefined && Object.keys(SPECIAL_ORDERS).indexOf(ck_special_order) >= 0) {
            $input_special_order.val(ck_special_order).trigger('change');
        } else {
            $input_special_order.val(SPECIAL_ORDERS[Object.keys(SPECIAL_ORDERS)[0]]).trigger('change');
        }

        $button_order.on('click', function(e) {
            $(this).prop('disabled', true);
            //alert('here');
            var market = $input_market.val();
            var pair = $input_pair.val();
            var special_order = $input_special_order.val();
            
            var side_1 = $('#id_side_1').val();
            var side_2 = $('#id_side_2').val();
            var side_3 = $('#id_side_3').val();
            
            var order_type_1 = $('#id_order_type_1').val();
            var order_type_2 = $('#id_order_type_2').val();
            var order_type_3 = $('#id_order_type_3').val();
            
            var price_1 = $('#id_price_1').val() == '' ? null : parseFloat($('#id_price_1').val());
            var price_2 = $('#id_price_2').val() == '' ? null : parseFloat($('#id_price_2').val());
            var price_3 = $('#id_price_3').val() == '' ? null : parseFloat($('#id_price_3').val());
            
            var price_for_stop_1 = $('#id_price_for_stop_1').val() == '' ? null : parseFloat($('#id_price_for_stop_1').val());
            var price_for_stop_2 = $('#id_price_for_stop_2').val() == '' ? null : parseFloat($('#id_price_for_stop_2').val());
            var price_for_stop_3 = $('#id_price_for_stop_3').val() == '' ? null : parseFloat($('#id_price_for_stop_3').val());

            var trail_width_1 = $('#id_trail_width_1').val() == '' ? null : parseFloat($('#id_trail_width_1').val());
            var trail_width_2 = $('#id_trail_width_2').val() == '' ? null : parseFloat($('#id_trail_width_2').val());
            var trail_width_3 = $('#id_trail_width_3').val() == '' ? null : parseFloat($('#id_trail_width_3').val());


            var start_amount_1 = $('#id_start_amount_1').val();
            var start_amount_2 = $('#id_start_amount_2').val();
            var start_amount_3 = $('#id_start_amount_3').val();
            
            
            switch ($input_special_order.val()) {
                case 'SINGLE':
                    var order_1 = create_order_json(market, pair, side_1, order_type_1, price_1, price_for_stop_1, trail_width_1, start_amount_1);
                    place_order(market, pair, special_order, order_1, null, null, $order_result_message_target);
                    break;
                case 'IFD':
                    var order_1 = create_order_json(market, pair, side_1, order_type_1, price_1, price_for_stop_1, trail_width_1, start_amount_1);
                    var order_2 = create_order_json(market, pair, side_2, order_type_2, price_2, price_for_stop_2, trail_width_2, start_amount_2);
                    place_order(market, pair, special_order, order_1, order_2, null, $order_result_message_target);
                    break;
                case 'OCO':
                    var order_2 = create_order_json(market, pair, side_2, order_type_2, price_2, price_for_stop_2, trail_width_2, start_amount_2);
                    var order_3 = create_order_json(market, pair, side_3, order_type_3, price_3, price_for_stop_3, trail_width_3, start_amount_3);        
                    place_order(market, pair, special_order, null, order_2, order_3, $order_result_message_target);
                    break;
                case 'IFDOCO':
                    var order_1 = create_order_json(market, pair, side_1, order_type_1, price_1, price_for_stop_1, trail_width_1, start_amount_1);
                    var order_2 = create_order_json(market, pair, side_2, order_type_2, price_2, price_for_stop_2, trail_width_2, start_amount_2);    
                    var order_3 = create_order_json(market, pair, side_3, order_type_3, price_3, price_for_stop_3, trail_width_3, start_amount_3);        
                    place_order(market, pair, special_order, order_1, order_2, order_3, $order_result_message_target);
                    break;
            }
            $(this).prop('disabled', false);
        });  
    }
}
function build_order_card_header(market, pair, special_order) {
    var row_1 = $('<div>', { 
        class: 'row'
    }).append($('<div>', {
        class: 'col-md-6 col-6 card-table-header',
        text: '取引所'
    })).append($('<div>', {
        class: 'col-md-6 col-6 card-table-data',
        text: MARKETS[market]
    }));

    var row_2 = $('<div>', { 
        class: 'row'
    }).append($('<div>', {
        class: 'col-md-6 col-6 card-table-header',
        text: '取引通貨'
    })).append($('<div>', {
        class: 'col-md-6 col-6 card-table-data',
        text: PAIRS[pair]
    }));

    var row_3 = $('<div>', { 
        class: 'row'
    }).append($('<div>', {
        class: 'col-md-6 col-6 card-table-header',
        text: '特殊注文'
    })).append($('<div>', {
        class: 'col-md-6 col-6 card-table-data',
        text: SPECIAL_ORDERS[special_order]
    }));

    return $('<div>', {
        class: 'order_header'
    }).append(row_1).append(row_2).append(row_3);
    
}
function build_active_order_card(is_cancellable, order_seq, pk, order_id, order_type, side, price, price_for_stop, trail_width, trail_price, start_amount, executed_amount,average_price, status, ordered_at) {
    
    var $row_1 = $('<div>', { 
        class: 'row'
    }).append($('<div>', {
        class: 'col-md-3 col-3 card-table-header',
        text: '注文ID'
    })).append($('<div>', {
        class: 'col-md-3 col-3 card-table-data',
        text: hyphen_if_null(order_id)
    })).append($('<div>', {
        class: 'col-md-3 col-3 card-table-header',
        text: '売/買'
    })).append($('<div>', {
        class: 'col-md-3 col-3 card-table-data',
        text: SELL_BUY[side]
    }));

    var $row_2 = $('<div>', { 
        class: 'row'
    }).append($('<div>', {
        class: 'col-md-3 col-3 card-table-header',
        text: 'タイプ'
    })).append($('<div>', {
        class: 'col-md-3 col-3 card-table-data',
        text: ORDER_TYPES[order_type]
    }));
   
    if (order_type == 'trail') {
        $row_2.append($('<div>', {
            class: 'col-md-3 col-3 card-table-header',
            text: 'トレール幅'
        })).append($('<div>', {
            class: 'col-md-3 col-3 card-table-data',
            text: hyphen_if_null(trail_width)
        }));
    } else {
        $row_2.append($('<div>', {
            class: 'col-md-3 col-3 card-table-header',
            text: '逆指値価格'
        })).append($('<div>', {
            class: 'col-md-3 col-3 card-table-data',
            text: hyphen_if_null(price_for_stop)
        }));
    }

    var $row_3 = $('<div>', { 
        class: 'row'
    }).append($('<div>', {
        class: 'col-md-3 col-3 card-table-header',
        text: '数量'
    })).append($('<div>', {
        class: 'col-md-3 col-3 card-table-data',
        text: hyphen_if_null(start_amount)
    }));
    
    if (order_type == 'trail') {
        $row_3.append($('<div>', {
            class: 'col-md-3 col-3 card-table-header',
            text: 'トレール金額'
        })).append($('<div>', {
            class: 'col-md-3 col-3 card-table-data',
            text: hyphen_if_null(trail_price)
        }));
    } else {
        $row_3.append($('<div>', {
            class: 'col-md-3 col-3 card-table-header',
            text: '指値価格'
        })).append($('<div>', {
            class: 'col-md-3 col-3 card-table-data',
            text: hyphen_if_null(price)
        }));
    }

    var $row_4 = $('<div>', { 
        class: 'row'
    }).append($('<div>', {
        class: 'col-md-3 col-3 card-table-header',
        text: '約定数量'
    })).append($('<div>', {
        class: 'col-md-3 col-3 card-table-data',
        text: hyphen_if_null(executed_amount)
    })).append($('<div>', {
        class: 'col-md-3 col-3 card-table-header',
        text: '平均価格'
    })).append($('<div>', {
        class: 'col-md-3 col-3 card-table-data',
        text: hyphen_if_null(average_price)
    }));

    var $row_5 = $('<div>', { 
        class: 'row'
    }).append($('<div>', {
        class: 'col-md-6 col-6 card-table-header',
        text: '注文日時'
    })).append($('<div>', {
        class: 'col-md-6 col-6 card-table-data',
        text: return_formatted_datetime(ordered_at)
    }));

    var $row_6 = $('<div>', { 
        class: 'row'
    }).append($('<div>', {
        class: 'col-md-6 col-6 card-table-header',
        text: 'ステータス'
    })).append($('<div>', {
        class: 'col-md-6 col-6 card-table-data',
        text: STATUS[status]
    }));
    var $row_7 = $('<div>', {
        class: 'row justify-content-end'
    })
    switch (order_seq) {
        case 'order_1':
            $row_7.append($('<span>', {
                class: 'badge badge-info',
                text: '新規注文'
            }));
            break;
        case 'order_2':
            $row_7.append($('<span>', {
                class: 'badge badge-success',
                text: '決済注文❶'
            }));
            
            break;
        case 'order_3':
            $row_7.append($('<span>', {
                class: 'badge badge-primary',
                text: '決済注文❷'
            }));
            break;
    }
    var $row_8 = $('<div>', { class: 'row' });
    if (is_cancellable) {
        $row_8.append($('<button>', {
            style: 'font-size:1rem; padding:0.2em!important',
            pk: pk,
            type: 'button',
            class: 'btn btn-outline-secondary',
            name: 'cancel_order_button',
            text: 'CANCEL'
        }));
    } else {
        $row_8.html('<p style="color:red;font-weight:bold">新規注文をCANCELする場合は、<br>先に決済注文を全てCANCELしてください</p>');
    }
    return $('<div>', {
        class: 'order_body'
    }).append($row_1).append($row_2).append($row_3).append($row_4).append($row_5).append($row_6).append($row_7).append($row_8);

   
}
function build_history_order_card(pk, market, order_id, pair, order_type, side, price, price_for_stop, start_amount, executed_amount,average_price, status, ordered_at, error_message, failed_at) {
    
    var $row_1 = $('<div>', { 
        class: 'row'
    }).append($('<div>', {
        class: 'col-md-3 col-3 card-table-header',
        text: '取引所'
    })).append($('<div>', {
        class: 'col-md-3 col-3 card-table-data',
        text: MARKETS[market]
    }));
    
    var $row_2 = $('<div>', { 
        class: 'row'
    }).append($('<div>', {
        class: 'col-md-3 col-3 card-table-header',
        text: '注文ID'
    })).append($('<div>', {
        class: 'col-md-3 col-3 card-table-data',
        text: hyphen_if_null(order_id)
    })).append($('<div>', {
        class: 'col-md-3 col-3 card-table-header',
        text: '取引通貨'
    })).append($('<div>', {
        class: 'col-md-3 col-3 card-table-data',
        text: PAIRS[pair]
    }));

    var $row_3 = $('<div>', { 
        class: 'row'
    }).append($('<div>', {
        class: 'col-md-3 col-3 card-table-header',
        text: 'タイプ'
    })).append($('<div>', {
        class: 'col-md-3 col-3 card-table-data',
        text: ORDER_TYPES[order_type]
    })).append($('<div>', {
        class: 'col-md-3 col-3 card-table-header',
        text: '売/買'
    })).append($('<div>', {
        class: 'col-md-3 col-3 card-table-data',
        text: SELL_BUY[side]
    }));

    
    var $row_4 = $('<div>', { 
        class: 'row'
    }).append($('<div>', {
        class: 'col-md-3 col-3 card-table-header',
        text: '数量'
    })).append($('<div>', {
        class: 'col-md-3 col-3 card-table-data',
        text: hyphen_if_null(start_amount)
    })).append($('<div>', {
        class: 'col-md-3 col-3 card-table-header',
        text: '指値価格'
    })).append($('<div>', {
        class: 'col-md-3 col-3 card-table-data',
        text: hyphen_if_null(price)
    }));

    var $row_5 = $('<div>', { 
        class: 'row'
    }).append($('<div>', {
        class: 'col-md-3 col-3 card-table-header',
        text: '約定数量'
    })).append($('<div>', {
        class: 'col-md-3 col-3 card-table-data',
        text: hyphen_if_null(executed_amount)
    })).append($('<div>', {
        class: 'col-md-3 col-3 card-table-header',
        text: '平均価格'
    })).append($('<div>', {
        class: 'col-md-3 col-3 card-table-data',
        text: hyphen_if_null(average_price)
    }));
    
    var $row_6 = $('<div>', { 
        class: 'row'
    }).append($('<div>', {
        class: 'col-md-6 col-6 card-table-header',
        text: '注文日時'
    })).append($('<div>', {
        class: 'col-md-6 col-6 card-table-data',
        text: return_formatted_datetime(ordered_at)
    }));
        
    var $row_7 = $('<div>', { 
        class: 'row'
    }).append($('<div>', {
        class: 'col-md-6 col-6 card-table-header',
        text: 'ステータス'
    })).append($('<div>', {
        class: 'col-md-6 col-6 card-table-data',
        text: STATUS[status]
    }));

    var $container = $('<div>', {
        class: 'order_history_body'
    }).append($row_1, $row_2, $row_3, $row_4, $row_5, $row_6, $row_7);

    if (error_message != null && error_message != "") {
       // console.log('error: ' + error_message);
        var $row_8 = $('<div>', {
            class: 'row'
        }).append($('<div>', {
            class: 'col-md-12 col-12 alert-danger',
            text: error_message
        }));
        var $row_9 = $('<div>', {
            class: 'row'
        }).append($('<div>', {
            class: 'col-md-4 col-4 card-table-header',
            text: 'エラー時刻'
        })).append($('<div>', {
            class: 'col-md-8 col-8 card-table-data',
            text: return_formatted_datetime(failed_at * 1000)
        }))
        //console.log($row_8);
        $container.append($row_8).append($row_9);
    }
    return $container;
}


function init_active_orders_content(market, pair, $message_target) {
    var $page_selection = $('#page_selection_active_orders');
    var $div_contents = $('#active_orders_content');

    call_orders('GET', market, pair, 0, 1, 'active')
    .done(function(res_1) {
        if (res_1.error) {
            set_error_message($message_target, res_1.error);
            return;
        }
        if($page_selection.data("twbs-pagination")){
            $page_selection.empty();
            $page_selection.removeData("twbs-pagination");
            $page_selection.unbind("page");
        }
        $page_selection.twbsPagination({
            totalPages: (res_1.total_count == 0) ? 1 : Math.ceil(res_1.total_count / COUNT_PER_PAGE),
            next: '次',
            prev: '前',
            first: '先頭',
            last: '最後',
            onPageClick: function (event, page) {
                
                call_orders('GET', market, pair, COUNT_PER_PAGE * (page - 1), COUNT_PER_PAGE, 'active')
                .done(function(res_2) {
                    if (res_2.error) {
                        set_error_message($message_target, res_2.error);
                        return;
                    }
                    $div_contents.empty();
                    var $outer = $('<div>', {class: 'row',});
                    var $inner = $('<div>', {class: 'col-md-6 offset-md-3 col-12'});
                    
                    var is_empty = true;
                    res_2.data.forEach(o => {
                        is_empty = false;
                        var $container = $('<div>', { class: 'order_container' })
                        .append(
                            build_order_card_header(o.market, o.pair, o.special_order)
                        );

                        if (o.order_1) {
                            //console.log(o.order_1.order_id + ':' + o.order_1.status);
                            $container.append(build_active_order_card(o.special_order == 'SINGLE', 'order_1', o.order_1.pk, o.order_1.order_id, o.order_1.order_type, o.order_1.side, o.order_1.price, o.order_1.price_for_stop, o.order_1.trail_width, o.order_1.trail_price, o.order_1.start_amount, o.order_1.executed_amount, o.order_1.average_price, o.order_1.status, o.order_1.ordered_at));
                        }
                        if (o.order_2) {
                            //console.log(o.order_2.order_id + ':' + o.order_2.status);
                            $container.append(build_active_order_card(true, 'order_2', o.order_2.pk, o.order_2.order_id, o.order_2.order_type, o.order_2.side, o.order_2.price, o.order_2.price_for_stop, o.order_2.trail_width, o.order_2.trail_price, o.order_2.start_amount, o.order_2.executed_amount, o.order_2.average_price, o.order_2.status, o.order_2.ordered_at));
                        }
                        if (o.order_3) {
                            //console.log(o.order_3.order_id + ':' + o.order_3.status);
                            $container.append(build_active_order_card(true, 'order_3', o.order_3.pk, o.order_3.order_id, o.order_3.order_type, o.order_3.side, o.order_3.price, o.order_3.price_for_stop, o.order_3.trail_width, o.order_3.trail_price, o.order_3.start_amount, o.order_3.executed_amount, o.order_3.average_price, o.order_3.status, o.order_3.ordered_at));
                        }
                        $inner.append($container).append($('<hr>'));
                    });
                    if (is_empty) {
                        $inner.append($('<p>', {
                            text: '取引はありません'
                        }));
                    }
                    $div_contents.append($outer.append($inner));

                    //キャンセルボタンクリック時のイベント追加
                    $("button[name='cancel_order_button']").on('click', function() {
                        var pk = $(this).attr('pk');
                        call_orders('DELETE', null, null, null, null, null, pk)
                        .done(function(res) {
                            if (res.error) {
                                set_error_message('#id_ajax_message', res.error);
                                return;
                            }
                        
                            set_success_message($message_target, '注文をキャンセルしました');
                            $('#active_orders_button').click();
                            $message_target.show();
                        })
                        .fail(function(data, textStatus, xhr) {
                            if (data.status == 401) {
                                window.location.href = BASE_URL_LOGIN;
                            }
                            set_error_message($message_target, xhr);
                        });
                        
                    });
                })
                .fail(function(data, textStatus, xhr) {
                    if (data.status == 401) {
                        window.location.href = BASE_URL_LOGIN;
                    }
                    set_error_message($message_target, xhr);
                });
            }
        });
    })
    .fail(function(data, textStatus, xhr) {
        if (data.status == 401) {
            window.location.href = BASE_URL_LOGIN;
        }
        set_error_message($message_target, xhr);
    });
}
function init_active_orders_tab(is_initial = false) {
    var $message_target = $('#id_ajax_message');
    var $input_search_pair = $('#id_active_orders_search_pair');
    var $input_search_market = $('#id_active_orders_search_market');
    
    if (is_initial) {
        $input_search_market
        .append($('<option>', {
            value: 'all',
            text: '全て'
        }));

        Object.keys(MARKETS).forEach(market => {
            $input_search_market
            .append($('<option>', {
                value: market,
                text: MARKETS[market]
            }))
        });

        $input_search_market
        .on('change', function() {
            init_active_orders_content($input_search_market.val(), $input_search_pair.val(), $message_target);
        });

        $input_search_pair
        .append($('<option>', {
            value: 'all',
            text: '全て'
        }));
        
        Object.keys(PAIRS).forEach(pair => {
            $input_search_pair
            .append($('<option>', {
                value: pair,
                text: PAIRS[pair]
            }));
        });

        $input_search_pair
        .on('change', function() {
            $.cookie(COOKIE_SEARCH_PAIR_ACTIVE_ORDERS, $(this).val(), {expire: 7});
            init_active_orders_content($input_search_market.val(), $input_search_pair.val(), $message_target);
        });
    }

    $input_search_market.val('all');

    var ck_search_pair_ao = $.cookie(COOKIE_SEARCH_PAIR_ACTIVE_ORDERS);
    if (ck_search_pair_ao != undefined) {
        $input_search_pair.val(ck_search_pair_ao);
    } else {
        $input_search_pair.val('all');
    }

    init_active_orders_content($input_search_market.val(), $input_search_pair.val(), $message_target);

}
function init_order_history_content(market, pair, $message_target) {
    var $page_selection = $('#page_selection_order_history');
    var $div_contents =  $('#order_history_content');

    call_orders('GET', market, pair, 0, 1, 'history')
    .done(function(res_1) {
        if (res_1.error) {
            set_error_message($message_target, res_1.error);
            return;
        }
        if($page_selection.data("twbs-pagination")){
            $page_selection.empty();
            $page_selection.removeData("twbs-pagination");
            $page_selection.unbind("page");
        } 
        $page_selection.twbsPagination({
            totalPages: (res_1.total_count == 0) ? 1 : Math.ceil(res_1.total_count / COUNT_PER_PAGE),
            next: '次',
            prev: '前',
            first: '先頭',
            last: '最後',
            onPageClick: function (event, page) {
                $div_contents.empty();
                var $outer = $('<div>', { class: 'row' });
                var $inner = $('<div>', { class: 'col-md-6 offset-md-3 col-12' });
            
                call_orders('GET', market, pair, COUNT_PER_PAGE * (page - 1), COUNT_PER_PAGE, 'history')
                .done(function(res_2) {
                    if (res_2.error) {
                        set_error_message($message_target, res_2.error);
                        return;
                    }
                    var is_empty = true;
                    res_2.data.forEach(order => {
                        is_empty = false;
                      
                        $inner
                        .append($('<div>',{
                            class: 'order_container'
                        }).append(build_history_order_card(order.pk, order.market, order.order_id, order.pair, order.order_type, order.side, order.price, order.price_for_stop, order.start_amount, order.executed_amount, order.average_price, order.status, order.ordered_at, order.error_message, order.updated_at)))
                        .append($('<hr>'));
                    });
                    // 1件もない場合
                    if (is_empty) {
                        $inner.append($('<p>', {
                            text: '取引はありません'
                        }));
                    }
                    $div_contents.append($outer.append($inner));
                })
                .fail(function(data, textStatus, xhr) {
                    if (data.status == 401) {
                        window.location.href = BASE_URL_LOGIN;
                    }
                    set_error_message($message_target, xhr);
                });
            }
        });
    })
    .fail(function(data, textStatus, xhr) {
        if (data.status == 401) {
            window.location.href = BASE_URL_LOGIN;
        }
        set_error_message($message_target, xhr);
    });
}
function init_order_history_tab(is_initial = false) {
    var $message_target = $('#id_ajax_message');
    var $input_search_pair = $('#id_order_history_search_pair');
    var $input_search_market = $('#id_order_history_search_market');
    
    
    if (is_initial) {
        $input_search_market
        .append($('<option>', {
            value: 'all',
            text: '全て'
        }))
        .on('change', function() {
            init_order_history_content($input_search_market.val(), $input_search_pair.val(), $message_target);
        });

        Object.keys(MARKETS).forEach(market => {
            $input_search_market
            .append($('<option>', {
                value: market,
                text: MARKETS[market]
            }));
        });

        $input_search_pair
        .append($('<option>', {
            value: 'all',
            text: '全て'
        }))
        .on('change', function() {
            $.cookie(COOKIE_SEARCH_PAIR_ORDER_HISTORY, $(this).val(), {expire: 7});
            init_order_history_content($input_search_market.val(), $input_search_pair.val(), $message_target);
        });

        Object.keys(PAIRS).forEach(pair => {
            $input_search_pair
            .append($('<option>', {
                value: pair,
                text: PAIRS[pair]
            }));
        });
        
    }

    $input_search_market.val('all');
    
    var ck_search_pair_oh = $.cookie(COOKIE_SEARCH_PAIR_ORDER_HISTORY);
    if (ck_search_pair_oh != undefined) {
        $input_search_pair.val(ck_search_pair_oh);
    } else {
        $input_search_pair.val('all');
    }
    init_order_history_content($input_search_market.val(), $input_search_pair.val(), $message_target);
}

function build_alert_card(pk, market, pair, rate) {
    var $outer_container = $('<div>', { class: 'order_container' });
    var $inner_container = $('<div>', { class: 'order_history_body' });
    var $row_1 = $('<div>', {
        class: 'row'
    }).append($('<div>', {
        class: 'col-md-3 col-3 card-table-header',
        text: '取引所'
    })).append($('<div>', {
        class: 'col-md-3 col-3 card-table-data',
        text: market
    })).append($('<div>', {
        class: 'col-md-3 col-3 card-table-header',
        text: '通貨'
    })).append($('<div>', {
        class: 'col-md-3 col-3 card-table-data',
        text: pair
    }));

    var $row_2 = $('<div>', {
        class: 'row'
    }).append($('<div>', {
        class: 'col-md-6 col-6 card-table-header',
        text: '通知レート'
    })).append($('<div>', {
        class: 'col-md-6 col-6 card-table-data',
        text: rate
    }));

    var $row_3 = $('<div>', {
        class: 'row'
    }).append($('<button>', {
        pk: pk,
        style: 'font-size:1rem; padding:0.2em!important',
        type: 'button',
        class: 'btn btn-outline-secondary',
        text: 'CANCEL',
        name: 'deactivate_alert_button'
    }));
    return $outer_container.append($inner_container.append($row_1).append($row_2).append($row_3));    

}

function init_alerts_content(market, pair, $message_target) {
    var $notify_if_filled_on_button = $('#notify_if_filled_on_button');
    var $notify_if_filled_off_button = $('#notify_if_filled_off_button');
    var $use_alert_on_button = $('#id_use_alert_on_button');
    var $use_alert_off_button = $('#id_use_alert_off_button');
    var $page_selection = $('#page_selection_alerts');
    var $container = $('#alert_container');


    call_user('GET')
    .done(function(res) {
        if (res.error) {
            set_error_message($message_target, res.error);
            return;
        }
        //console.log(res);
        if (res.notify_if_filled == 'ON') {
            $notify_if_filled_on_button.click();
        } else {
            $notify_if_filled_off_button.click();
            
        }
        if (res.use_alert == 'ON') {
            $use_alert_on_button.click();
        } else {
            $use_alert_off_button.click();
        }
    })
    .fail(function(data, textStatus, xhr) {
        if (data.status == 401) {
            window.location.href = BASE_URL_LOGIN;
        }
        set_error_message($message_target, xhr);
    });

    
    call_alerts('GET', null, market, pair, 0, 1)
    .done(function(res_1) {
        if (res_1.error) {
            set_error_message($message_target, res_1.error);
            return;
        }
        if($page_selection.data("twbs-pagination")){
            $page_selection.empty();
            $page_selection.removeData("twbs-pagination");
            $page_selection.unbind("page");
        }
        $page_selection.twbsPagination({
            totalPages: (res_1.total_count == 0) ? 1 : Math.ceil(res_1.total_count / COUNT_PER_PAGE),
            next: '次',
            prev: '前',
            first: '先頭',
            last: '最後',
            onPageClick: function (event, page) {
                $container.empty();
                call_alerts('GET', null, market, pair, COUNT_PER_PAGE * (page - 1), COUNT_PER_PAGE)
                .done(function(res_2) {
                    var $outer = $('<div>', { class: 'row' });
                    var $inner = $('<div>', { class: 'col-md-6 offset-md-3 col-12' });

                    res_2.data.forEach(alert => {
                        
                        $inner.append(build_alert_card(alert.pk, alert.market, alert.pair, alert.rate)).append($('<hr>'));
                       
                    });

                    $container.append($outer.append($inner));

                    $("button[name='deactivate_alert_button']").on('click', function() {
                        var pk = $(this).attr('pk');
                        call_alerts('DELETE', pk)
                        .done(function(res_3) {
                            if (res_3.error) {
                                set_error_message($message_target, res_3.error);
                                return;
                            }
                            set_success_message('#id_ajax_message', '通知設定を解除しました');
                            
                            $('#alerts_button').click();
                           $message_target.show();
                        })
                        .fail(function(data, textStatus, xhr) {
                            if (data.status == 401) {
                                window.location.href = BASE_URL_LOGIN;
                            }
                            set_error_message($message_target, xhr);
                        });
                    });
                })
                .fail(function(data, textStatus, xhr) {
                    if (data.status == 401) {
                        window.location.href = BASE_URL_LOGIN;
                    }
                    set_error_message($message_target, xhr);
                });
            }
        });

    })
    .fail(function(data, textStatus, xhr) {
        if (data.status == 401) {
            window.location.href = BASE_URL_LOGIN;
        }
        set_error_message($message_target, xhr);
    });
}

function init_alert_rate(market, pair, $target, $message_target) {
    call_ticker('GET', market, pair)
    .done((data) => {
        if (data.error) {
            set_error_message($message_target, data.error);
            return;
        }
        $target.val(data.last);
    })
    .fail((data, textStatus, xhr) => {
        if (data.status == 401) {
            window.location.href = BASE_URL_LOGIN;
        }
        set_error_message($message_target, xhr);
    });
}

function init_alerts_tab(is_initial = false) {
    var $message_target = $('#id_ajax_message');
    var $alert_market = $('#id_alerts_market');
    var $alert_pair = $('#id_alerts_pair');
    var $alert_search_market = $('#id_alerts_search_market');
    var $alert_search_pair = $('#id_alerts_search_pair');

    var $notify_if_filled_on_button = $('#notify_if_filled_on_button');
    var $notify_if_filled_off_button = $('#notify_if_filled_off_button');
    var $use_alert_on_button = $('#id_use_alert_on_button');
    var $use_alert_off_button = $('#id_use_alert_off_button');
    var $add_button = $('#add_alert_button');
    
    var $notice_rate = $('#id_notice_rate');
    var $pair_for_alert_class = $('.pair_for_alert');

    // 初回時のみの処理
    if (is_initial) {

        $alert_market.on('change', function() {
            $alert_pair.empty();
            if ($alert_market.val() == 'bitbank') {
                Object.keys(PAIRS).forEach(key => {
                    $('<option>', {
                        value: key,
                        text: PAIRS[key]
                    }).appendTo($alert_pair);
                    $('<option>', { value: 'all', text: '全て' }).appendTo($alert_pair);
                });
            } else {
                $('<option>', { value: 'btc_jpy', text: PAIRS['btc_jpy'] }).appendTo($alert_pair);
                $('<option>', { value: 'all', text: '全て' }).appendTo($alert_pair);
            }
            init_alert_rate($alert_market.val(), $alert_pair.val(), $notice_rate, $message_target);
        });
        $alert_search_market.on('change', function() {
            $alert_search_pair.empty();
            if ($(this).val() == 'bitbank') {
                $('<option>', { value: 'all', text: '全て' }).appendTo($alert_search_pair);
                Object.keys(PAIRS).forEach(key => {
                    $('<option>', {
                        value: key,
                        text: PAIRS[key],
                    }).appendTo($alert_search_pair);
                    
                });
                
            } else {
                $('<option>', { value: 'all', text: '全て' }).appendTo($alert_search_pair);
                $('<option>', { value: 'btc_jpy', text: PAIRS['btc_jpy'] }).appendTo($alert_search_pair);
                
            }
            init_alerts_content($alert_search_market.val(), $alert_search_pair.val(), $message_target);
        })

        $alert_pair.on('change', function() {
            
            $.cookie(COOKIE_ALERT_PAIR, $(this).val(), {expire: 7});
            var currency = $(this).val().split('_')[1].toUpperCase();
            $pair_for_alert_class.html(currency);
            init_alert_rate($alert_market.val(), $alert_pair.val(), $notice_rate, $message_target);
        });

        $alert_search_pair.on('change', function() {
            init_alerts_content($alert_search_market.val(), $alert_search_pair.val(), $message_target);
        });

        $notify_if_filled_on_button.on('click', function() {
            if ($(this).hasClass('on')) {
                // すでにONの場合は何もしない
            } else {
                call_notify_if_filled('ON')
                .done(function(res) {
                    if (res.error) {
                       
                        console.log(res);
                        set_error_message($message_target, res.error);
                        return;
                    }
                    $notify_if_filled_on_button.addClass('on').removeClass('btn-base');
                    $notify_if_filled_off_button.removeClass('off').addClass('btn-base');
                })
                .fail(function(data, textStatus, xhr) {
                    if (data.status == 401) {
                        window.location.href = BASE_URL_LOGIN;
                    }
                    set_error_message($message_target, xhr);
                });
            }
        });
        $notify_if_filled_off_button.on('click', function() {
            
            if ($(this).hasClass('off')) {
                // すでにOFFの場合は何もしない
               
            } else {
                call_notify_if_filled('OFF')
                .done(function(res) {
                    if (res.error) {
                        set_error_message($message_target, res.error);
                        return;
                    }
                    
                    $notify_if_filled_on_button.removeClass('on').addClass('btn-base');
                    $notify_if_filled_off_button.addClass('off').removeClass('btn-base');
                })
                .fail(function(data, textStatus, xhr) {
                    if (data.status == 401) {
                        window.location.href = BASE_URL_LOGIN;
                    }
                    set_error_message($message_target, xhr);
                });
            }
        });

        $use_alert_on_button.on('click', function() {
            if ($(this).hasClass('on')) {
                // すでにONの場合は何もしない
            } else {
                call_use_alert('ON')
                .done(function(res) {
                    if (res.error) {
                        set_error_message($message_target, res.error);
                        return;
                    }
                    $use_alert_on_button.addClass('on').removeClass('btn-base');
                    $use_alert_off_button.removeClass('off').addClass('btn-base');
                })
                .fail(function(data, textStatus, xhr) {
                    if (data.status == 401) {
                        window.location.href = BASE_URL_LOGIN;
                    }
                    set_error_message($message_target, xhr);
                });
            }
        });
        $use_alert_off_button.on('click', function() {
            if ($(this).hasClass('off')) {
                // すでにOFFの場合は何もしない
            } else {
                call_use_alert('OFF')
                .done(function(res) {
                    if (res.error) {
                        set_error_message($message_target, res.error);
                        return;
                    }
                    $use_alert_on_button.removeClass('on').addClass('btn-base');
                    $use_alert_off_button.addClass('off').removeClass('btn-base');
                })
                .fail(function(data, textStatus, xhr) {
                    if (data.status == 401) {
                        window.location.href = BASE_URL_LOGIN;
                    }
                    set_error_message($message_target, xhr);
                });
            }
        });


        $add_button.on('click', function() {
        
            var rate = $notice_rate.val();
            var market = $alert_market.val();
            var pair = $alert_pair.val();
            var over_or_under;

            if (rate == '' || rate == 0) {
                set_error_message($message_target,'通知金額を入力して下さい');
                return;
            }

            call_alerts('POST', null, market, pair, null, null, rate)
            .done(function(res) {
                console.log(res);
                if (res.error) {
                    console.log(res.error);
                    set_error_message($message_target, res.error)
                    return;
                }
                set_success_message($message_target, 'アラートを追加しました');

                $('#alerts_button').click();
                $message_target.show();
            })
            .fail(function(data, textStatus, xhr) {
                if (data.status == 401) {
                    window.location.href = BASE_URL_LOGIN;
                }
                set_error_message($message_target, xhr);
            });
        });
        $('<option>', { value: 'all', text: '全て' }).appendTo($alert_search_market);
        $('<option>', { value: 'all', text: '全て' }).appendTo($alert_search_pair);
        
        Object.keys(MARKETS).forEach(key => {
            $('<option>', { value: key, text: MARKETS[key] }).appendTo($alert_market);
            $('<option>', { value: key, text: MARKETS[key] }).appendTo($alert_search_market);
         
        });

        Object.keys(PAIRS).forEach(key => {
            $('<option>', { value: key, text: PAIRS[key]}).appendTo($alert_pair);
            $('<option>', { value: key, text: PAIRS[key]}).appendTo($alert_search_pair);
        });

        
        $alert_market.val('bitbank').trigger('change');
        $alert_search_market.val('bitbank').trigger('change');

        var ck_alert_pair = $.cookie(COOKIE_ALERT_PAIR);
        
        if (ck_alert_pair != undefined && Object.keys(PAIRS).indexOf(ck_alert_pair) >= 0) {
            $alert_pair.val(ck_alert_pair).trigger('change');
        } else {
            $alert_pair.val(Object.keys(PAIRS)[0]).trigger('change');
        }
        $alert_search_pair.val('btc_jpy').trigger('change');
    }
    init_alerts_content($alert_search_market.val(), $alert_search_pair.val(), $message_target);
}
function init_asset_tab(is_initial = false) {
    var $message_target = $('#id_ajax_message');
    var $total_asset_bb = $('#total_in_jpy_bb');
    call_assets('GET', 'bitbank')
    .done(response => {
        if (response.assets) {
            var total_asset_in_jpy = 0;
            response.assets.forEach(asset => {
                $('#' + asset.asset + '_bb').html(asset.onhand_amount);
                if (asset.asset == 'ltc' || asset.asset == 'eth') {
                    call_ticker('GET', 'bitbank', asset.asset + '_' + 'btc')
                    .done(function(res) {
                        if (res.error) {
                            set_error_message($message_target, res.error);
                            return;
                        }
                        call_ticker('GET', 'bitbank', 'btc_jpy')
                        .done(function(res2) {
                            total_asset_in_jpy += parseFloat(res.buy) * parseFloat(res2.buy) * asset.onhand_amount;
                            $total_asset_bb.html(parseInt(total_asset_in_jpy));
                        })
                        .fail(function(data, textStatus, xhr) {
                            if (data.status == 401) {
                                window.location.href = BASE_URL_LOGIN;
                            }
                            set_error_message($message_target, xhr);
                        });
                    })
                    .fail(function(data, textStatus, xhr) {
                        if (data.status == 401) {
                            window.location.href = BASE_URL_LOGIN;
                        }
                        set_error_message($message_target, xhr);
                    });
                } else if (asset.asset != 'jpy') {
                    call_ticker('GET', 'bitbank', asset.asset + '_jpy')
                    .done(function(res) {
                        if (res.error) {
                            set_error_message($message_target, res.error);
                            return;
                        }
                        total_asset_in_jpy += parseInt(res.buy * asset.onhand_amount);
                        $total_asset_bb.html(parseInt(total_asset_in_jpy));
                    })
                    .fail(function(data, textStatus, xhr) {
                        if (data.status == 401) {
                            window.location.href = BASE_URL_LOGIN;
                        }
                        set_error_message($message_target, xhr);
                    });
                } else {
                    total_asset_in_jpy += parseInt(asset.onhand_amount);
                    $total_asset_bb.html(parseInt(total_asset_in_jpy));
                }
            });
            //$("#asset_table").html(asset_html);
        } else {
            if (response.error) {
                set_error_message($message_target, response.error);
            }
        }
    })
    .fail(function(data, textStatus, xhr) {
        if (data.status == 401) {
            window.location.href = BASE_URL_LOGIN;
        }
        set_error_message($message_target, xhr);
    });
    call_assets('GET', 'coincheck')
    .done(response => {
        if (!response.success) {
            set_error_message($message_target, 'coincheck 残高の取得に失敗しました');
            return;
        }
        //console.log(response.jpy);
        $('#jpy_cc').html(response.jpy);
        $('#btc_cc').html(response.btc);
        $('#eth_cc').html(response.eth);
        $('#etc_cc').html(response.etc);
        $('#lsk_cc').html(response.lsk);
        $('#fct_cc').html(response.fct);
        $('#xrp_cc').html(response.xrp);
        $('#xem_cc').html(response.xem);
        $('#ltc_cc').html(response.ltc);
        $('#bcc_cc').html(response.bch);        
    })
}
function init_user_info_tab(is_initial = false) {
    var $message_target = $('#id_ajax_message');
    call_user('GET')
    .done(function(data) {
        if (data.error) {
            set_error_message($message_target, data.error);
            return;
        }
        //console.log(data);
        $('#id_date_joined').html(return_formatted_datetime(Date.parse(data.date_joined), false));
        $('#id_email').html(data.email);
        $('#id_full_name').val(data.full_name);
        $('#id_bb_api_key').val(data.bb_api_key);
        $('#id_bb_api_secret_key').val(data.bb_api_secret_key);
        $('#id_cc_api_key').val(data.cc_api_key);
        $('#id_cc_api_secret_key').val(data.cc_api_secret_key);
        
        $('#id_email_for_notice').val(data.email_for_notice);
    })
    .fail(function(data, textStatus, xhr) {
        if (data.status == 401) {
            window.location.href = BASE_URL_LOGIN;
        }
        set_error_message($message_target, xhr);
    });
    // 初期ロード時のみ
    if (is_initial) {
        $('#id_update_user_info_button').on('click', function() {
            var full_name = $('#id_full_name').val();
            var bb_api_key = $('#id_bb_api_key').val();
            var bb_api_secret_key = $('#id_bb_api_secret_key').val();
            var cc_api_key = $('#id_cc_api_key').val();
            var cc_api_secret_key = $('#id_cc_api_secret_key').val();
            
            var email_for_notice = $('#id_email_for_notice').val();

            if(!email_for_notice.match(/^([a-zA-Z0-9])+([a-zA-Z0-9\._-])*@([a-zA-Z0-9_-])+([a-zA-Z0-9\._-]+)+$/)){
                // 不正なメールアドレスの場合
                set_error_message($message_target, 'メールアドレスの形式が不正です');
                $('#id_email_for_notice').focus();
                return;
            }

            call_user('POST', full_name, bb_api_key, bb_api_secret_key, cc_api_key, cc_api_secret_key, email_for_notice)
            .done(function(res) {
                if (res.error) {
                    console.log(res.error);
                    set_error_message($message_target, res.error);
                    return;
                }
                set_success_message($message_target, '登録情報を更新しました');
                return;
            })
            .fail(function(data, textStatus, xhr) {
                if (data.status == 401) {
                    window.location.href = BASE_URL_LOGIN;
                }
                set_error_message($message_target, xhr);
            });
        });
    }
}

function validate_contact_info($message_target) {
    //validations....
    var name = $('#id_contact_name');
    var email = $('#id_contact_email');
    var subject = $('#id_contact_subject');
    var body = $('#id_contact_body');
    
    if (name.val() == '') {
        set_error_message($message_target, '名前を入力してください');
        name.focus();
        return false;
    }
    if (email.val() == '') {
        set_error_message($message_target, '通知用メールアドレスを入力してください');
        email.focus();
        return false;
    }
    if (subject.val() == '') {
        set_error_message($message_target, '件名を入力してください');
        subject.focus();
        return false;
    }
    if (body.val() == '') {
        set_error_message($message_target, '内容を入力してください');
        body.focus();
        return false;
    }
    return true;
}



function init_contact_tab(is_initial = false) {
    var attachment_pk_list = [];
    var $message_target = $('#id_contact_message');
    call_user('GET')
    .done(function(data) {
        if (data.error) {
            set_error_message($message_target, data.error);
            return;
        }
        $('#id_contact_date').html(return_formatted_datetime((new Date()).getTime(), false));
        $('#id_contact_email').val(data.email_for_notice);
        $('#id_contact_name').val(data.full_name);
    })
    .fail(function(data, textStatus, xhr) {
        if (data.status == 401) {
            window.location.href = BASE_URL_LOGIN;
        }
        set_error_message($message_target, xhr);
    });
    // 初期ロード時のみ
    if (is_initial) {
        // var detach_button = $('#id_detach_file');
        var file_uploader = $('#fileupload');
        var attach_button = $('.js-upload-file');
        var inquiry_button = $('#id_contact_send_inquiry_button');
        var input_subject = $('#id_contact_subject');
        var input_body = $('#id_contact_body');
        var input_email = $('#id_contact_email');
        var preview_zone = $('#id_attachment_preview');
        var progress_bar = $('.progress');

        inquiry_button
        .on('click', function() {
            if (validate_contact_info($message_target)) {
                call_inquiry('POST', input_subject.val(), input_body.val(), input_email.val(), attachment_pk_list)
                .done(function(res) {
                    if (res.error) {
                        set_error_message($message_target, res.error);
                        return;
                    }
                    set_success_message($message_target, res.success);
                    return;
                })
                .fail(function(data, textStatus, xhr) {
                    if (data.status == 401) {
                        window.location.href = BASE_URL_LOGIN;
                    }
                    set_error_message($message_target, xhr);
                });
            }
        });

        
        /* 2. INITIALIZE THE FILE UPLOAD COMPONENT */
        file_uploader.fileupload({
            dataType: 'json',
            singleFileUploads: true,
            autoUpload: true,
            replaceFileInput: false,
            done: function (e, data) {  /* 3. PROCESS THE RESPONSE FROM THE SERVER */
                if (data.result.error) {
                    //alert('error');
                    set_error_message(message_target, data.result.error);
                    return;
                }
                if (attachment_pk_list.length >= 3) {
                    set_error_message(message_target, '添付ファイルは3つまでです');
                    return;
                }
                attachment_pk_list.push(data.result.pk + '');
                
                $container = $('<div>', {
                    class: "container attachment_preview",
                    style: "width:30%;height:auto;float:left;position:relative"
                }).appendTo(preview_zone);

                $img_wrapper = $('<div>', {
                    style: "position:relative"
                })
                .appendTo($container)
                .on('click', function() {
                    var i = attachment_pk_list.indexOf($(this).attr('pk'));
                    attachment_pk_list.splice(i, 1);
                    call_attachment('DELETE', $(this).attr('pk'))
                    .done((data) => {
                        if (data.error) {
                            set_error_message(message_target, data.error);
                            return;
                        }
                        $(this).parent().remove();
                    })
                    .fail(function(data, textStatus, xhr) {
                        if (data.status == 401) {
                            window.location.href = BASE_URL_LOGIN;
                        }
                        set_error_message(message_target, xhr);
                    });
                });

                $img = $('<img>', {
                    class: 'img-thumbnail',
                    id: 'file_' + data.result.pk,
                }).appendTo($img_wrapper);
                
                $('<div>', {
                    class: 'text',
                    text: '×'
                }).appendTo($img_wrapper);
                
                $('<p>', {
                    text: data.files[0].name,
                    style:"word-break : break-all;"
                }).appendTo($container);

                readURL(data.files[0], $img);
                
            },
            fail: function (e, data) {
                set_error_message(message_target, '失敗しました');
                return;
            }
        });
    }
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
function set_error_message(target, message="ログインし直してください") {

    $(target).addClass('alert-danger');
    $(target).removeClass('alert-success');
    $(target).html(message);
    $(target).show();
    setTimeout(function() {
        $(target).fadeOut();
    }, 10000);
}

function set_success_message(target, message="正常に処理しました") {
    $(target).addClass('alert-danger');
    $(target).removeClass('alert-success');
    $(target).html('<i class="fa fa-check" aria-hidden="true"></i>' + message);
    $(target).show();
    setTimeout(function() {
        $(target).fadeOut();
    }, 2000);
}

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


