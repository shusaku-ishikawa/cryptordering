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

async function cancel_order_async(pk) {
    let reuslt;
    try {
        result = await call_orders('DELETE', pk);
        if (result.error) {
            set_error_message(result.error);
            return false;
        }
        console.log(result);
        return true;
    } catch (error) {
        handle_error(error);
        return false;
    }
}
async function update_order_async(pk, side, order_type, limit_price, stop_price, trail_width, amount) {
    let result;
    try {
        result = await call_orders('UPDATE', pk, null, null, null, null, side, order_type, limit_price, stop_price, trail_width, amount);
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
    
    $sellbuyselect = $('<select>', { class: 'side' });
    Object.keys(SELL_BUY).forEach((key, i) => {
        $sellbuyselect.append($('<option>', {
            value: key,
            text: SELL_BUY[key],
            
        }));
    });

    $ordertypeselect = $('<select>', {class: 'order_type' });
    Object.keys(ORDER_TYPES).forEach((key, i) => {
        $ordertypeselect.append($('<option>', {
            value: key,
            text: ORDER_TYPES[key],
        }));
    });
    $ordertypeselect.on('change', function(event, is_init) {
        var $card = $(this).closest('.order_body');
        var type = $(this).val();
        
        $card.find('.limit_price').prop('readonly', !type.includes('limit'));
        $card.find('.stop_price').prop('readonly', !type.includes('stop'));
        $card.find('.trail_width').prop('readonly', !type.includes('trail'));
        if (is_init != true) {
            if ($(this).val() == 'stop_limit') {
                set_info_message('ストップリミット時即約定さすには、<br>売りの場合は約定希望価格を発動価格よりも安く設定<br>買いの場合は約定希望価格を発動価格よりも高く設定');
            }
        }
    });

    $limitpriceinput = $('<input>', {
        type: 'text',
        type2: 'number',
        class: 'limit_price',
        value: price,
    });

    $stoppriceinput = $('<input>', {
        type: 'text',
        type2: 'number',
        class: 'stop_price',
        value: price_for_stop,
    });

    $trailwidth = $('<input>', {
        class: 'trail_width',
        type: 'text',
        type2: 'number',
        value: trail_width,
        
    });
    $amountinput = $('<input>', {
        type: 'text',
        type2: 'number',
        class: 'amount',
        value: start_amount
    });

   
    

    var $row_3 = $('<div>', { 
        class: 'row'
    }).append($('<div>', {
        class: col_3_head,
        text: '売/買'
    })).append($('<div>', {
        class: col_3_data,
    }).append($sellbuyselect)
    ).append($('<div>', {
        class: col_3_head,
        text: 'タイプ'
    })).append($('<div>', {
        class: col_3_data,
    }).append($ordertypeselect));

    var $row_4 = $('<div>', { 
        class: 'row'
    }).append($('<div>', {
        class: col_3_head,
        text: '指値金額'
    })).append($('<div>', {
        class: col_3_data,
    }).append($limitpriceinput)
    ).append($('<div>', {
        class: col_3_head,
        text: '逆指値価格'
    })).append($('<div>', {
        class: col_3_data,
    }).append($stoppriceinput));

    var $row_5 = $('<div>', { 
        class: 'row'
    }).append($('<div>', {
        class: col_3_head,
        text: 'トレール幅'
    })).append($('<div>', {
        class: col_3_data,
    }).append($trailwidth));
    
    var $row_6 = $('<div>', {
        class: 'row'
    }).append($('<div>', {
        class: col_3_head,
        text: '数量'
    })).append($('<div>', {
        class: col_3_data,
    }).append($amountinput)).append($('<div>', {
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
    console.log('status;;' + status)

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
        var $cancelbutton = $('<button>', {
            pk: pk,
            type: 'button',
            class: 'btn btn-outline-secondary',
            name: 'cancel_order_button',
            text: 'CANCEL'
        }).append($('<div>', {
            class : 'loader spinner ld ld-ring ld-spin'
        })).append($('<div>', {
            class: 'loader overlay'
        }));
        $cancelbutton.on('click', async function() {
            $(this).prop('disabled', true);
            let pk = $(this).attr('pk');
            let is_succeeded = await cancel_order_async(pk);
            if (is_succeeded) {
                set_success_message('キャンセルが成功しました');
                $('#active_orders_button').click();
            }
            $(this).prop('disabled', false);
        });
    } else {
        var $cancelbutton = $('<button>', {
            type: 'button',
            class: 'btn btn-outline-secondary',
            name: 'cancel_order_button',
            text: 'CANCEL',
        });
        $cancelbutton.on('click', async function() {
            set_error_message('先に決済注文をキャンセルしてください')
            return false;
        });
    }

    

    var $updatebutton = $('<button>', {
        pk: pk,
        type: 'button',
        class: 'btn btn-outline-secondary',
        name: 'update_order_button',
        text: 'UPDATE'
    }).append($('<div>', {
        class : 'loader spinner ld ld-ring ld-spin'
    })).append($('<div>', {
        class: 'loader overlay'
    }));

    $updatebutton.on('click', async function() {
        $(this).prop('disabled', true);
        var $card = $(this).closest('.order_body');
        var pk = $(this).attr('pk');
        var side = $card.find('.side').val();
        var order_type = $card.find('.order_type').val();
        var limit_price = $card.find('.limit_price').val();
        var stop_price = $card.find('.stop_price').val();
        var trail_width = $card.find('.trail_width').val();
        var amount = $card.find('.amount').val();

        let result = await update_order_async(pk, side, order_type, limit_price, stop_price, trail_width, amount);
        if (result) {
            set_success_message('注文の更新が完了しました')
            $('#active_orders_button').click();
        }
        let $input_search_market = $('#id_active_orders_search_market');
        $input_search_market.trigger('change');
        $(this).prop('disabled', false);
    })

    $row_8_col_1.append($cancelbutton).append($updatebutton);
    
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
    
    var $orderbody = $('<div>', {
        class: 'order_body'
    }).append($row_1).append($row_2).append($row_3).append($row_4).append($row_5).append($row_6).append($row_7).append($row_8);

    $sellbuyselect.val(side).trigger('change');
    $ordertypeselect.val(order_type).trigger('change', true);
    return $orderbody;
   
}
function _on_active_order_page_click($div_contents, market, pair, limit) {
    return async function(event, page) {
        let active_orders;
        try {
            active_orders = await call_relations('GET', market, pair, limit * (page - 1), limit)
            if (active_orders.error) {
                set_error_message(active_orders.error);
                return false;
            }
            $div_contents.empty();
            var $outer = $('<div>', {class: 'row',});
            var $inner = $('<div>', {class: 'col-md-6 offset-md-3 col-12'});
            
            var is_empty = true;
            active_orders.data.forEach(o => {
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
            return true;

        } catch (error) {
           handle_error(error);
           return false;
        }
    }
}
       

async function init_active_orders_content_async(market, pair) {
    var $page_selection = $('#page_selection_active_orders');
    var $div_contents = $('#active_orders_content');
    
    let active_orders;
    try {
        active_orders = await call_relations('GET', market, pair, 0, 1);
        let total_count = active_orders.total_count;

        if (active_orders.error) {
            set_error_message(active_orders.error);
            return false;
        }
        if($page_selection.data("twbs-pagination")){
            $page_selection.empty();
            $page_selection.removeData("twbs-pagination");
            $page_selection.unbind("page");
        }
        $page_selection.twbsPagination({
            totalPages: (total_count == 0) ? 1 : Math.ceil(total_count / COUNT_PER_PAGE),
            next: '次',
            prev: '前',
            first: '先頭',
            last: '最後',
            onPageClick: _on_active_order_page_click($div_contents, market, pair, COUNT_PER_PAGE)
        });
    } catch (error) {
       handle_error(error);
    }
}
function init_active_orders_tab(is_initial = false) {
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
            init_active_orders_content_async($input_search_market.val(), $input_search_pair.val());
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
            init_active_orders_content_async($input_search_market.val(), $input_search_pair.val());
        });
    }

    $input_search_market.val('all');

    var ck_search_pair_ao = $.cookie(COOKIE_SEARCH_PAIR_ACTIVE_ORDERS);
    if (ck_search_pair_ao != undefined) {
        $input_search_pair.val(ck_search_pair_ao);
    } else {
        $input_search_pair.val('all');
    }

    init_active_orders_content_async($input_search_market.val(), $input_search_pair.val());

}
