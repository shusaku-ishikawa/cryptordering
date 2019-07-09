
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
function update_amount_by_price(tab_num) {
    console.log('update_amount_by_price');
    
    $target = $('#id_start_amount_' + tab_num);
    var new_val = parseFloat($('#expect_price_' + tab_num).val());
    var market = $('#id_market').val();
    var pair = $('#id_pair').val();
    var side = $('#id_side_' + tab_num).val();
    var price;
    var order_type = $('#id_order_type_' + tab_num).val();
    if (order_type.match(/limit/)) {
        price = parseFloat($('#id_price_' + tab_num).val());
    } else {
        price = parseFloat(market_price_json[market][pair][side]);
    }
    $target.val(new_val / price).trigger('change_by_price');
}
function update_amount_by_slider(tab_num) {
    console.log('update_amount_by_slide');
    var $perc = $('#amount_percentage_' + tab_num);
    var $amount = $('#id_start_amount_' + tab_num);
    var newVal = parseInt($('#myRange_' + tab_num).val());
    newVal = (newVal >= 0.5) ? newVal - 0.5 : newVal;
    var market = $('#id_market').val();
    var pair = $('#id_pair').val();
    var side = $('#id_side_' + tab_num).val();
    var limitprice = parseFloat($('#id_price_' + tab_num).val());
    var stopprice = parseFloat($('#id_price_for_stop_' + tab_num).val());
    var order_type = $('#id_order_type_' + tab_num).val();
    var currency = (side == 'sell') ? pair.split('_')[0] : pair.split('_')[1];

    var round_at = 100000000;

    $perc.html(Math.round(newVal) + '%');


    if (newVal != 0) {
        var free_amount = parseFloat(free_amount_json[market][currency]);
        console.log('before ' + free_amount);
        if (tab_num == 2 || tab_num == 3) {
            var if_done_order_type = $('#id_order_type_1').val();
            var if_done_amount = parseFloat($('#id_start_amount_1').val());
            var if_done_side = $('#id_side_1').val();
            // 新規注文数が入力されている場合
            if (!isNaN(if_done_amount)) {
                var if_done_price = (if_done_order_type.includes('limit')) ? parseFloat($('#id_price_1').val()) : market_price_json[market][pair]['buy'];
                if (if_done_side == 'buy') {
                    free_amount -= (side == 'buy') ? if_done_amount * if_done_price : -if_done_amount;
                } else {
                    free_amount += (side == 'buy') ? if_done_amount * if_done_price : -if_done_amount;
                }
            }
            console.log('after ' + free_amount);
        }
        
        var price = (order_type.match(/limit/)) ? (limitprice != '') ? limitprice : 0 : (order_type.match(/stop/)) ? stopprice : market_price_json[market][pair][side];
        console.log(price);

        var floored = (side == 'sell') ? Math.floor((parseFloat(free_amount) * newVal / 100) * round_at) / round_at : (price != 0) ? Math.floor((free_amount * newVal / (price * 100)) * round_at) / round_at : 0;
        //var floored = (side == 'sell') ? parseFloat(free_amount) * newVal / 100 : (price != 0) ? free_amount * newVal / (price * 100) : 0;
        
        if (isNaN(floored)) {
            $perc.html('資金不足');
        } else {
            $amount.val(floored).trigger('calculate');
        }
    } else {
        $amount.val(null).trigger('calculate');
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

    var new_price;
    // limit orderの場合
    if (order_type.match(/limit/)) {
        new_price = price;
    } else {
        if ((market in market_price_json) && (pair in market_price_json[market]) && (side in market_price_json[market][pair])) {
            new_price = market_price_json[market][pair][side];
        } else {
            new_price = (price == null) ? 0 : price;
        }
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
            var rounded = Math.round(perc);
            set_slidevalue(tab_num, rounded, false);
         
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
async function _order_async(market, pair, special_order, order_1, order_2, order_3) {
    let result;
    try {
        result = await call_relations('POST', market, pair, null, null, special_order, order_1, order_2, order_3);
        if (result.error) {
            set_error_message(result.error);
            return false;
        }
        return true;
    } catch (error) {
        handle_error(error);
        return false;
    }
        
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
async function place_order_async(market, pair, special_order, order_1, order_2, order_3) {
    let ticker;
    try {
        ticker = await call_ticker('GET', market, pair);
        if (ticker.error) {
            set_error_message(ticker.error);
            return false;
        }
            
        if (order_1 != null && order_1.order_type == 'limit') {
            if ((order_1.side == 'buy' && parseFloat(ticker.buy) < order_1.price) || (order_1.side  == 'sell' && parseFloat(ticker.sell) > order_1.price)){
                if (!get_confirmation('新規注文')) {
                    return false;
                }
            }
        }
        if (order_1 == null && order_2.order_type == 'limit') {
            if ((order_2.side == 'buy' && parseFloat(ticker.buy) < order_2.price) || (order_2.side  == 'sell' && parseFloat(ticker.sell) > order_2.price)){
                if (!get_confirmation('決済注文1')) {
                    return false;
                }
            }
        } 
        if (order_1 == null && order_3.order_type == 'limit') {
            if ((order_3.side == 'buy' && parseFloat(ticker.buy) < order_3.price) || (order_3.side  == 'sell' && parseFloat(ticker.sell) > order_3.price)){
                if (!get_confirmation('決済注文2')) {
                    return false;
                }
            }
        } 
        let is_succeeded = await _order_async(market, pair, special_order, order_1, order_2, order_3);
        if (is_succeeded) {
            set_success_message('注文が完了しました')
        }
    } catch (error) {
        handle_error(error);
    }           
}
function set_slidevalue(tab_num, new_val, trigger_input_event=true) {
    var $tar = $('#myRange_' + tab_num);
    var $side = $('#id_side_' + tab_num);

    if (trigger_input_event) {
        $tar.val(new_val).trigger('input');
    } else {
        $tar.val(new_val);
    }
    
    init_range_input($tar, $side);
    $('#amount_percentage_' + tab_num).html(new_val + '%');
}
function set_default_price(tab_num, market, pair, side) {
    var new_order_type = $('#id_order_type_' + tab_num).val();
   
    if (!market_price_json[market][pair]) {
        set_error_message(market + 'のレートの取得に失敗しました。')
    }
    var current_rate = market_price_json[market][pair][side];
    if (new_order_type != 'market') {
        $('#id_price_' + tab_num).val(current_rate);
        $('#id_price_for_stop_' + tab_num).val(current_rate);
    }
}
function reset_input(i) {
    $('#id_trail_width_' + i).val(null);
    $('#id_price_' + i).val(null);
    $('#id_price_for_stop_' + i).val(null);
    $('#id_start_amount_' + i).val(null);
    $('#expect_price_' + i).val(null);
    set_slidevalue(i, 0, false);
}
function reset_input_all(market, pair) {
    var default_side = Object.keys(SELL_BUY)[1];
    var default_order_type = Object.keys(ORDER_TYPES)[1];
    for (let i = 1; i < 4; i++) {
        reset_input(i);
        $('#id_side_' + i).val(default_side).trigger('value_change');
        $('#id_order_type_' + i).val(default_order_type).trigger('change');
        set_default_price(i, market, pair, 'last');
    }
}
function init_range_input($me, $side) {
    var val = ($me.val() - $me.attr('min')) / ($me.attr('max') - $me.attr('min'));
    $me.css('background-image',
        '-webkit-gradient(linear, left top, right top, '
        + 'color-stop(' + val + ', ' + ($side.val() == 'buy' ? 'teal' : 'orangered') + '),'
        + 'color-stop(' + val + ', #333333)'
        + ')'
    );
}

function init_order_tab(is_initial = false) {
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
            console.log('market change');
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
            
            $.cookie(COOKIE_ORDER_MARKET, $(this).val(), { expires: 7 });
            switch ($(this).val()) {
                case 'bitbank':
                    var ck_pair = $.cookie(COOKIE_ORDER_PAIR_BB);
                    if (ck_pair != undefined && Object.keys(PAIRS).indexOf(ck_pair) >= 0) {
                        console.log(ck_pair);
                        $input_pair.val(ck_pair).trigger('change');
                    } else {
                        // 無ければ先頭の選択肢をセット
                        $input_pair.val(Object.keys(PAIRS)[0]).trigger('change');
                    }
                    
                    var ck_special_order = $.cookie(COOKIE_SPECIAL_ORDER_BB);
                    if (ck_special_order != undefined && Object.keys(SPECIAL_ORDERS).indexOf(ck_special_order) >= 0) {
                        $input_special_order.val(ck_special_order).trigger('change');
                    } else {
                        $input_special_order.val(SPECIAL_ORDERS[Object.keys(SPECIAL_ORDERS)[0]]).trigger('change');
                    }
                    break;
                case 'coincheck':
                    var ck_pair = $.cookie(COOKIE_ORDER_PAIR_CC);
                    if (ck_pair != undefined && Object.keys(PAIRS).indexOf(ck_pair) >= 0) {
                        $input_pair.val(ck_pair).trigger('change');
                    } else {
                        // 無ければ先頭の選択肢をセット
                        $input_pair.val(Object.keys(PAIRS)[0]).trigger('change');
                    }
                    
                    var ck_special_order = $.cookie(COOKIE_SPECIAL_ORDER_CC);
                    if (ck_special_order != undefined && Object.keys(SPECIAL_ORDERS).indexOf(ck_special_order) >= 0) {
                        $input_special_order.val(ck_special_order).trigger('change');
                    } else {
                        $input_special_order.val(SPECIAL_ORDERS[Object.keys(SPECIAL_ORDERS)[0]]).trigger('change');
                    }
                    break;
            }
            reset_input_all($(this).val(), $input_pair.val())
            
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
            var $this = $(this);
            switch ($input_market.val()) {
                case 'bitbank':
                    $.cookie(COOKIE_SPECIAL_ORDER_BB, $(this).val(), { expires: 7 });
                    break;
                case 'coincheck':
                    $.cookie(COOKIE_SPECIAL_ORDER_CC, $(this).val(), { expires: 7 });
                    break;
            }

               
            $slick
            .slick('slickUnfilter')
            .slick('slickFilter', function(index){
                switch ($this.val()) {
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
            for (var i = 1; i < 4; i++) {
                var $order_type_select = $('#id_order_type_' + i);
                if ( ($this.val() == 'OCO' || $this.val() == 'IFDOCO') && i >= 2) {
                    $order_type_select.find('option').each(function() {
                        if ($(this).val() == 'market') {
                            $(this).prop('disabled', true);
                        }
                    });
                } else {
                    $order_type_select.find('option').prop('disabled', false);
                }
            }
            reset_input_all($input_market.val(), $input_pair.val()); 
        });

        $input_pair.on('change', function() {
            switch ($input_market.val()) {
                case 'bitbank':
                    $.cookie(COOKIE_ORDER_PAIR_BB, $(this).val(), { expires: 7 });
                    break;
                case 'coincheck':
                    $.cookie(COOKIE_ORDER_PAIR_CC, $(this).val(), { expires: 7 });
                    break;
            }
            

            reset_input_all($input_market.val(), $input_pair.val());   
            
            // 数量、金額の通貨部分を更新
            var unit = $input_pair.val().split('_')[0].toUpperCase();
            var currency = $input_pair.val().split('_')[1].toUpperCase();
            update_unit_currency(currency, unit);
            
            $slick.slick('slickGoTo', 0);
        });
        

        for (let i = 1; i < 4; i++) {
            
            $('#myRange_' + i).on("input", function () {
                update_amount_by_slider(i);
                var val = ($(this).val() - $(this).attr('min')) / ($(this).attr('max') - $(this).attr('min'));
                init_range_input($(this), $('#id_side_' + i));
            });

            $('#id_start_amount_' + i)
            .on('change', function() {
                update_slider_by_amount(i);
                calculate_expect_price(i);
            })
            .on('change_by_price', function() {
                update_slider_by_amount(i);
            })
            .on('calculate', function() {
                calculate_expect_price(i);
            });

            $('#id_price_' + i)
            .on('change', function() {
                update_slider_by_amount(i);
                calculate_expect_price(i);
            });

            $('#expect_price_' + i)
            .on('change', function() {
                update_amount_by_price(i);    
            });

            $('#id_order_type_' + i)
            .on('change', function() {
               // reset_input(i);
                var new_order_type = $(this).val();

                if (new_order_type == 'limit') {
                    $('#id_price_placeholder_' + i).html('指値価格');
                } else if (new_order_type == 'stop_market') {
                    $('#id_stop_price_placeholder_' + i).html('逆指値価格');
                } else if (new_order_type == 'stop_limit') {
                    $('#id_stop_price_placeholder_' + i).html('逆指値(発動価格)');
                    $('#id_price_placeholder_' + i).html('指値(約定希望価格)');
                }
                
                display_price_div(i, new_order_type);
                update_slider_by_amount(i);
                calculate_expect_price(i);

            });

            $('#id_side_' + i)
            .on('value_change', function() {
                $('#id_start_amount_' + i).trigger('change');
                init_range_input($('#myRange_' + i), $(this));

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
                // 決済注文では成り行き非活性
                $('<option>', {
                    value: key,
                    text: ORDER_TYPES[key],
                }).appendTo($('#id_order_type_' + i));
            });
            set_default_price(i, $input_market.val(), $input_pair.val(), $('#id_side_' + i).val());
        }
        
        var ck_market = $.cookie(COOKIE_ORDER_MARKET);
        if (ck_market != undefined && Object.keys(MARKETS).indexOf(ck_market) >= 0) {
           // alert(ck_market);
            $input_market.val(ck_market).trigger('value_change');
        } else {
            // 無ければ先頭の選択肢をセット
            $input_market.val(Object.keys(MARKETS)[0]).trigger('value_change');
        }
        
        switch ($input_market.val()) {
            case 'bitbank':
                var ck_pair = $.cookie(COOKIE_ORDER_PAIR_BB);
                if (ck_pair != undefined && Object.keys(PAIRS).indexOf(ck_pair) >= 0) {
                    $input_pair.val(ck_pair).trigger('change');
                } else {
                    // 無ければ先頭の選択肢をセット
                    $input_pair.val(Object.keys(PAIRS)[0]).trigger('change');
                }
                
                var ck_special_order = $.cookie(COOKIE_SPECIAL_ORDER_BB);
                if (ck_special_order != undefined && Object.keys(SPECIAL_ORDERS).indexOf(ck_special_order) >= 0) {
                    $input_special_order.val(ck_special_order).trigger('change');
                } else {
                    $input_special_order.val(SPECIAL_ORDERS[Object.keys(SPECIAL_ORDERS)[0]]).trigger('change');
                }
                break;
            case 'coincheck':
                var ck_pair = $.cookie(COOKIE_ORDER_PAIR_CC);
                if (ck_pair != undefined && Object.keys(PAIRS).indexOf(ck_pair) >= 0) {
                    $input_pair.val(ck_pair).trigger('change');
                } else {
                    // 無ければ先頭の選択肢をセット
                    $input_pair.val(Object.keys(PAIRS)[0]).trigger('change');
                }
                
                var ck_special_order = $.cookie(COOKIE_SPECIAL_ORDER_BB);
                if (ck_special_order != undefined && Object.keys(SPECIAL_ORDERS).indexOf(ck_special_order) >= 0) {
                    $input_special_order.val(ck_special_order).trigger('change');
                } else {
                    $input_special_order.val(SPECIAL_ORDERS[Object.keys(SPECIAL_ORDERS)[0]]).trigger('change');
                }
                break;
        }
        // クッキーにあればデフォルトセット
        

        $button_order.on('click', async function(e) {
            $(this).prop('disabled', true);
            
            //alert('here');
            var market = $input_market.val();
            var pair = $input_pair.val();
            var special_order = $input_special_order.val();
            
            var side_1 = $('#id_side_1').val();
            var side_2 = $('#id_side_2').val();
            var side_3 = $('#id_side_3').val();
            
            var perc_1 = $('#myRange_1').val();
            var perc_2 = $('#myRange_2').val();
            var perc_3 = $('#myRange_3').val();
            
            var order_type_1 = $('#id_order_type_1').val();
            var order_type_2 = $('#id_order_type_2').val();
            var order_type_3 = $('#id_order_type_3').val();

            // bitbank成行注文制限
            if (market == 'bitbank') {
                if (order_type_1 != undefined) {
                    if ( (order_type_1.includes('market') || order_type_1 == 'trail') && perc_1 > 70.0 ) {
                        set_error_message('bitbankでは70%を超える成行注文はできません。新規注文の数量を変更してください。');
                        $(this).prop('disabled', false);
                        return;
                    }
                }
                if (order_type_2 != undefined) {
                    if ( (order_type_2.includes('market') || order_type_2 == 'trail') && perc_2 > 70.0 ) {
                        set_error_message('bitbankでは70%を超える成行注文はできません。決済注文①の数量を変更してください。');
                        $(this).prop('disabled', false);
                        return;
                    }
                }
                if (order_3 != undefined) {
                    if ( (order_type_3.includes('market') || order_type_3 == 'trail') && perc_3 > 70.0 ) {
                        set_error_message('bitbankでは70%を超える成行注文はできません。決済注文②の数量を変更してください。');
                        $(this).prop('disabled', false);
                        return;
                    }
                }  
            }
            

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
                    await place_order_async(market, pair, special_order, order_1, null, null);
                    break;
                case 'IFD':
                    var order_1 = create_order_json(market, pair, side_1, order_type_1, price_1, price_for_stop_1, trail_width_1, start_amount_1);
                    var order_2 = create_order_json(market, pair, side_2, order_type_2, price_2, price_for_stop_2, trail_width_2, start_amount_2);
                    await place_order_async(market, pair, special_order, order_1, order_2, null);
                    break;
                case 'OCO':
                    var order_2 = create_order_json(market, pair, side_2, order_type_2, price_2, price_for_stop_2, trail_width_2, start_amount_2);
                    var order_3 = create_order_json(market, pair, side_3, order_type_3, price_3, price_for_stop_3, trail_width_3, start_amount_3);        
                    await place_order_async(market, pair, special_order, null, order_2, order_3);
                    break;
                case 'IFDOCO':
                    var order_1 = create_order_json(market, pair, side_1, order_type_1, price_1, price_for_stop_1, trail_width_1, start_amount_1);
                    var order_2 = create_order_json(market, pair, side_2, order_type_2, price_2, price_for_stop_2, trail_width_2, start_amount_2);    
                    var order_3 = create_order_json(market, pair, side_3, order_type_3, price_3, price_for_stop_3, trail_width_3, start_amount_3);        
                    await place_order_async(market, pair, special_order, order_1, order_2, order_3);
                    break;
            }
            $(this).prop('disabled', false);
            init_free_amount_json_async();
        });  
    } else {
        
    }
}

