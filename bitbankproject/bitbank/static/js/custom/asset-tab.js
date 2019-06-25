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
