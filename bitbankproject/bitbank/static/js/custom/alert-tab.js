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

    $container.empty();
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
                call_alerts('GET', null, market, pair, COUNT_PER_PAGE * (page - 1), COUNT_PER_PAGE)
                .done(function(res_2) {
                    $container.empty();
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
            init_alert_rate($alert_market.val(), $alert_pair.val(), $notice_rate, $message_target);
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
    init_alerts_content($alert_search_market.val(), $alert_search_pair.val(), $message_target);
}


