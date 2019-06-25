function build_order_card_header(pk, market, pair, special_order, placed_at) {
    var col_3_head = 'col-md-3 col-3 card-table-header';
    var col_3_data = 'col-md-3 col-3 card-table-data';
    var col_6_head = 'col-md-6 col-6 card-table-header';
    var col_6_data = 'col-md-6 col-6 card-table-data';
    
    
    var row_1 = $('<div>', { 
        class: 'row'
    }).append($('<div>', {
        class: col_6_head,
        text: '特殊注文ID'
    })).append($('<div>', {
        class: col_6_data,
        text: ('0000000' + pk).slice(-8)
    }));
    
    var row_2 = $('<div>', { 
        class: 'row'
    }).append($('<div>', {
        class: col_6_head,
        text: '特殊注文日時'
    })).append($('<div>', {
        class: col_6_data,
        text: convert_iso_datetime(placed_at)
    }));
    
    var row_3 = $('<div>', { 
        class: 'row'
    }).append($('<div>', {
        class: col_3_head,
        text: '取引所'
    })).append($('<div>', {
        class: col_3_data,
        text: MARKETS[market]
    })).append($('<div>', {
        class: col_3_head,
        text: '取引通貨'
    })).append  ($('<div>', {
        class: col_3_data,
        text: PAIRS[pair]
    }));

    var $row_4 = $('<div>', { 
        class: 'row'
    }).append($('<div>', {
        class: col_3_head,
        text: '特殊注文'
    })).append($('<div>', {
        class: col_3_data,
        text: SPECIAL_ORDERS[special_order]
    }));

    return $('<div>', {
        class: 'order_header'
    }).append(row_1).append(row_2).append(row_3).append($row_4);
    
}

function build_active_order_card(is_cancellable, order_seq, pk, order_id, order_type, side, price, price_for_stop, trail_width, trail_price, start_amount, executed_amount,average_price, status, ordered_at) {
    var col_3_head = 'col-md-3 col-3 card-table-header';
    var col_3_data = 'col-md-3 col-3 card-table-data';
    var col_6_head = 'col-md-6 col-6 card-table-header';
    var col_6_data = 'col-md-6 col-6 card-table-data';
    
    
    var $row_1 = $('<div>', { 
        class: 'row'
    }).append($('<div>', {
        class: col_6_head,
        text: '注文ID'
    })).append($('<div>', {
        class: col_6_data,
        text: hyphen_if_null(order_id)
    }));

    var $row_2 = $('<div>', { 
        class: 'row'
    }).append($('<div>', {
        class: col_6_head,
        text: '注文日時'
    })).append($('<div>', {
        class: col_6_data,
        text: return_formatted_datetime(ordered_at)
    }));
    

    var $row_3 = $('<div>', { 
        class: 'row'
    }).append($('<div>', {
        class: col_3_head,
        text: '売/買'
    })).append($('<div>', {
        class: col_3_data,
        text: SELL_BUY[side]
    })).append($('<div>', {
        class: col_3_head,
        text: 'タイプ'
    })).append($('<div>', {
        class: col_3_data,
        text: ORDER_TYPES[order_type]
    }));

    var $row_4 = $('<div>', { 
        class: 'row'
    }).append($('<div>', {
        class: col_3_head,
        text: '指値金額'
    })).append($('<div>', {
        class: col_3_data,
        text: hyphen_if_null(price)
    })).append($('<div>', {
        class: col_3_head,
        text: '逆指値価格'
    })).append($('<div>', {
        class: col_3_data,
        text: hyphen_if_null(price_for_stop)
    }));

    var $row_5 = $('<div>', { 
        class: 'row'
    }).append($('<div>', {
        class: col_3_head,
        text: 'トレール幅'
    })).append($('<div>', {
        class: col_3_data,
        text: hyphen_if_null(trail_width)
    }));
    
    var $row_6 = $('<div>', {
        class: 'row'
    }).append($('<div>', {
        class: col_3_head,
        text: '数量'
    })).append($('<div>', {
        class: col_3_data,
        text: hyphen_if_null(start_amount)
    })).append($('<div>', {
        class: col_3_head,
        text: '約定数量'
    })).append($('<div>', {
        class: col_3_data,
        text: hyphen_if_null(executed_amount)
    }));
    

    var $row_7 = $('<div>', { 
        class: 'row'
    }).append($('<div>', {
        class: col_3_head,
        text: '平均価格'
    })).append($('<div>', {
        class: col_3_data,
        text: hyphen_if_null(average_price)
    })).append($('<div>', {
        class: col_3_head,
        text: 'ステータス'
    })).append($('<div>', {
        class: col_3_data,
        text: STATUS[status]
    }));

    var $row_8 = $('<div>', {
        class: 'row justify-content-end'
    });

    var $row_8_col_1 = $('<div>', {
        class: col_6_head
    });
    var $row_8_col_2 = $('<div>', {
        class: col_6_data
    });

    if (is_cancellable) {
        $row_8_col_1.append($('<button>', {
            style: 'font-size:1rem; padding:0.1em!important',
            pk: pk,
            type: 'button',
            class: 'btn btn-outline-secondary',
            name: 'cancel_order_button',
            text: 'CANCEL'
        }));
    } else {
        $row_8_col_1.html('<p style="color:orangered;">新規注文をCANCELする場合は、<br>先に決済注文を全てCANCELしてください</p>');
    }

    $row_8_col_1.appendTo($row_8);

    switch (order_seq) {
        case 'order_1':
            $row_8_col_2.append($('<span>', {
                class: 'badge badge-info',
                text: '新規注文'
            }));
            break;
        case 'order_2':
            $row_8_col_2.append($('<span>', {
                class: 'badge badge-success',
                text: '決済注文❶'
            }));
            
            break;
        case 'order_3':
            $row_8_col_2.append($('<span>', {
                class: 'badge badge-primary',
                text: '決済注文❷'
            }));
            break;
    }
    $row_8_col_2.appendTo($row_8);
    
    return $('<div>', {
        class: 'order_body'
    }).append($row_1).append($row_2).append($row_3).append($row_4).append($row_5).append($row_6).append($row_7).append($row_8);

   
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
                            build_order_card_header(o.pk, o.market, o.pair, o.special_order, o.placed_at)
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
