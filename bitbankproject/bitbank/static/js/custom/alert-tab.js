function build_alert_card(pk, market, pair, rate, comment) {
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
    }).append($('<div>', {
        class: 'col-md-4 col-4 card-table-header',
        text: 'コメント'
    })).append($('<div>', {
        class: 'col-md-8 col-8 card-table-data',
        text: comment
    }));
    

    var $row_4 = $('<div>', {
        class: 'row'
    }).append($('<button>', {
        pk: pk,
        style: 'font-size:1rem; padding:0.2em!important',
        type: 'button',
        class: 'btn btn-outline-secondary',
        text: 'CANCEL',
        name: 'deactivate_alert_button'
    }));
    return $outer_container.append($inner_container.append($row_1).append($row_2).append($row_3).append($row_4));    

}
function _on_page_click_async($container, market, pair, limit) {
    return async function(event, page) {
        let alerts;
        try {
            alerts = await call_alerts('GET', null, market, pair, limit * (page - 1), limit);
            $container.empty();
            var $outer = $('<div>', { class: 'row' });
            var $inner = $('<div>', { class: 'col-md-6 offset-md-3 col-12' });
            alerts.data.forEach(alert => {
                $inner.append(build_alert_card(alert.pk, alert.market, alert.pair, alert.rate, alert.comment)).append($('<hr>'));
            });
    
            $container.append($outer.append($inner));
    
            $("button[name='deactivate_alert_button']").on('click', async function() {
                var pk = $(this).attr('pk');
                let result;
                try {
                    result = await call_alerts('DELETE', pk);
                    if (result.error) {
                        set_error_message(result.error);
                        return false;
                    }
                    set_success_message('通知設定を解除しました');
                    $('#alerts_button').click();
                    return true;
                } catch (error) {
                    handle_error(error);
                }
            });
        } catch (error) {
            handle_error(error);
        }
    }; 
}
async function init_alerts_content_async(market, pair) {
    var $notify_if_filled_on_button = $('#notify_if_filled_on_button');
    var $notify_if_filled_off_button = $('#notify_if_filled_off_button');
    var $use_alert_on_button = $('#id_use_alert_on_button');
    var $use_alert_off_button = $('#id_use_alert_off_button');
    var $page_selection = $('#page_selection_alerts');
    var $container = $('#alert_container');

    $container.empty();
    let user;
    try {
        user = await call_user('GET');
        if (user.error) {
            set_error_message(user.error);
            return false;
        }
        if (user.notify_if_filled == 'ON') {
            $notify_if_filled_on_button.click();
        } else {
            $notify_if_filled_off_button.click();
            
        }
        if (user.use_alert == 'ON') {
            $use_alert_on_button.click();
        } else {
            $use_alert_off_button.click();
        }
    } catch (error) {
        handle_error(error);
        return false;
    }
    
    let alerts;
    try {
        alerts = await call_alerts('GET', null, market, pair, 0, 1);
        if (alerts.error) {
            set_error_message(alerts.error);
            return false;
        }
        if($page_selection.data("twbs-pagination")){
            $page_selection.empty();
            $page_selection.removeData("twbs-pagination");
            $page_selection.unbind("page");
        }
        $page_selection.twbsPagination({
            totalPages: (alerts.total_count == 0) ? 1 : Math.ceil(alerts.total_count / COUNT_PER_PAGE),
            next: '次',
            prev: '前',
            first: '先頭',
            last: '最後',
            onPageClick: _on_page_click_async($container, market, pair, COUNT_PER_PAGE)
        });
        
        return true;
    } catch (error) {
        handle_error(error);
        return false;
    };
}

async function init_alert_rate_async(market, pair, $target) {
    let result;
    try {
        result = await call_ticker('GET', market, pair);
        if (result.error) {
            set_error_message(result.error);
            return false;
        }
        $target.val(result.last);
    } catch (error) {
        handle_error(error);
        return false;
    }
}

async function create_alert_async(market, pair, rate, comment) {
    let result;
    try {
        result = await call_alerts('POST', null, market, pair, null, null, rate, comment);
        if (result.error) {
            set_error_message(result.error)
            return false;
        }
        set_success_message('アラートを追加しました');
        return true;
    } catch(error) {
        handle_error(error);
        return error;
    }
}

async function update_use_alert_async($on_button, $off_button, on_or_off) {
    let result;
    try {
        result = await call_use_alert(on_or_off);
        if (result.error) {
            set_error_message(result.error);
            return false;
        }
        if (on_or_off == 'ON') {
            $on_button.addClass('on').removeClass('btn-base');
            $off_button.removeClass('off').addClass('btn-base');        
        } else {
            $off_button.addClass('off').removeClass('btn-base');
            $on_button.removeClass('on').addClass('btn-base');
        }
        return true;
    } catch (error) {
        handle_error(error);
        return false;
    }
}

async function update_notify_async($on_button, $off_button, on_or_off) {
    let result;
    try {
        result = await call_notify_if_filled(on_or_off);
        if (result.error) {
            set_error_message(result.error);
            return false;
        }
        if (on_or_off == 'ON') {
            $on_button.addClass('on').removeClass('btn-base');
            $off_button.removeClass('off').addClass('btn-base');
        } else {
            $off_button.addClass('off').removeClass('btn-base');
            $on_button.removeClass('on').addClass('btn-base');
        }
        return true;
    } catch (error) {
        handle_error(error);
    }
}
 
function init_alerts_tab(is_initial = false) {
    var $alert_market = $('#id_alerts_market');
    var $alert_pair = $('#id_alerts_pair');
    var $alert_comment = $('#id_alerts_comment');
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
            $.cookie(COOKIE_ALERT_MARKET, $(this).val(), {expire: 7});
            
            $alert_pair.empty();
            if ($alert_market.val() == 'bitbank') {
                Object.keys(PAIRS).forEach(key => {
                    $('<option>', {
                        value: key,
                        text: PAIRS[key]
                    }).appendTo($alert_pair);
                });
            } else {
                $('<option>', { value: 'btc_jpy', text: PAIRS['btc_jpy'] }).appendTo($alert_pair);
            }
            init_alert_rate_async($alert_market.val(), $alert_pair.val(), $notice_rate);
        });
        $alert_search_market.on('change', function() {
            $alert_search_pair.empty();

            $('<option>', { value: 'all', text: '全て' }).appendTo($alert_search_pair);
            
            if ($(this).val() != 'coincheck') {
                Object.keys(PAIRS).forEach(key => {
                    $('<option>', {
                        value: key,
                        text: PAIRS[key],
                    }).appendTo($alert_search_pair);
                    
                });
                
            } else {
                $('<option>', { value: 'btc_jpy', text: PAIRS['btc_jpy'] }).appendTo($alert_search_pair);   
            }
            init_alerts_content_async($alert_search_market.val(), $alert_search_pair.val());
        })

        $alert_pair.on('change', function() {
            
            $.cookie(COOKIE_ALERT_PAIR, $(this).val(), {expire: 7});
            var currency = $(this).val().split('_')[1].toUpperCase();
            $pair_for_alert_class.html(currency);
            init_alert_rate_async($alert_market.val(), $alert_pair.val(), $notice_rate);
        });

        $alert_search_pair.on('change', function() {
            init_alerts_content_async($alert_search_market.val(), $alert_search_pair.val());
        });

        $notify_if_filled_on_button.on('click', function() {
            if ($(this).hasClass('on')) {
                // すでにONの場合は何もしない
            } else {
                // updte_notify_on
                update_notify_async($notify_if_filled_on_button, $notify_if_filled_off_button, 'ON');
            }
        });
        $notify_if_filled_off_button.on('click', function() {
            
            if ($(this).hasClass('off')) {
                // すでにOFFの場合は何もしない
               
            } else {
                update_notify_async($notify_if_filled_on_button, $notify_if_filled_off_button, 'OFF');
            }
        });

        $use_alert_on_button.on('click', function() {
            if ($(this).hasClass('on')) {
                // すでにONの場合は何もしない
            } else {
                // USE alert on
                update_use_alert_async($use_alert_on_button, $use_alert_off_button, 'ON');
            }
        });
        $use_alert_off_button.on('click', function() {
            if ($(this).hasClass('off')) {
                // すでにOFFの場合は何もしない
            } else {
                update_use_alert_async($use_alert_on_button, $use_alert_off_button, 'OFF')
            }
        });


        $add_button.on('click', async function() {
            $(this).prop('disabled', true);
            var rate = $notice_rate.val();
            var market = $alert_market.val();
            var pair = $alert_pair.val();
            var comment = $alert_comment.val();

            if (rate == '' || rate == 0) {
                set_error_message('通知金額を入力して下さい');
                return;
            }
            let result;
            result = await create_alert_async(market, pair, rate, comment);
            $(this).prop('disabled', false );
            if (result.error) {
                handle_error(result.error)
                return;
            }
            set_success_message('アラートを追加しました');
            $alert_comment.val('');
            $('#alerts_button').click();
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

        
        $alert_search_market.val('all').trigger('change');
        $alert_search_pair.val('all').trigger('change');

        var ck_alert_pair = $.cookie(COOKIE_ALERT_PAIR);
        var ck_alert_market = $.cookie(COOKIE_ALERT_MARKET);
        
        if (ck_alert_market != undefined && Object.keys(MARKETS).indexOf(ck_alert_market) >= 0) {
            $alert_market.val(ck_alert_market);
        } else {
            $alert_market.val(Object.keys(MARKETS)[0]);
        }

        if (ck_alert_pair != undefined && Object.keys(PAIRS).indexOf(ck_alert_pair) >= 0) {
            $alert_pair.val(ck_alert_pair).trigger('change');
        } else {
            $alert_pair.val(Object.keys(PAIRS)[0]).trigger('change');
        }


        
    }   
    init_alerts_content_async($alert_search_market.val(), $alert_search_pair.val());
}


