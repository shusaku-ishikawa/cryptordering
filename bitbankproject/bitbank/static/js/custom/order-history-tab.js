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

function _on_history_page_click($div_contents, market, pair, limit) {
    return async function (event, page) {
        $div_contents.empty();
        var $outer = $('<div>', { class: 'row' });
        var $inner = $('<div>', { class: 'col-md-6 offset-md-3 col-12' });
        
        let history;
        try {
            history = await call_orders('GET', null, market, pair, limit * (page - 1), limit);

            if (history.error) {
                set_error_message(history.error);
                return false;
            }
            var is_empty = true;
            history.data.forEach(order => {
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
            return true;
        } catch (error) {
           handle_error(error);
        }
    }
}
async function init_order_history_content_async(market, pair) {
    var $page_selection = $('#page_selection_order_history');
    var $div_contents =  $('#order_history_content');

    let history;
    try {
        history = await call_orders('GET', null,  market, pair, 0, 1);
        if (history.error) {
            set_error_message(history.error);
            return;
        }
        if($page_selection.data("twbs-pagination")){
            $page_selection.empty();
            $page_selection.removeData("twbs-pagination");
            $page_selection.unbind("page");
        } 
        $page_selection.twbsPagination({
            totalPages: (history.total_count == 0) ? 1 : Math.ceil(history.total_count / COUNT_PER_PAGE),
            next: '次',
            prev: '前',
            first: '先頭',
            last: '最後',
            onPageClick: _on_history_page_click($div_contents, market, pair, COUNT_PER_PAGE)
        });
    } catch (error) {
        console.log(error);
        handle_error(error);
    }
}
function init_order_history_tab(is_initial = false) {
    var $input_search_pair = $('#id_order_history_search_pair');
    var $input_search_market = $('#id_order_history_search_market');
    
    
    if (is_initial) {
        $input_search_market
        .append($('<option>', {
            value: 'all',
            text: '全て'
        }))
        .on('change', function() {
            init_order_history_content_async($input_search_market.val(), $input_search_pair.val());
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
            init_order_history_content_async($input_search_market.val(), $input_search_pair.val());
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
    init_order_history_content_async($input_search_market.val(), $input_search_pair.val());
}


