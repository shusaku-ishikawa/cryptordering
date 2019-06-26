async function init_asset_tab(is_initial = false) {
    
    var $message_target = $('#id_ajax_message');
    var $total_asset_bb = $('#total_in_jpy_bb');
    var total_asset_in_jpy = 0;
    await init_ticker_json($message_target);
    await init_free_amount_json($message_target);
    var bb_asset = free_amount_json['bitbank'];
    var bb_rate = market_price_json['bitbank'];
    var cc_asset = free_amount_json['coincheck'];
    var cc_rate = market_price_json['coincheck'];
    var base_side = 'last';

    Object.keys(bb_asset).forEach(asset_name => {
        $('#' + asset_name + '_bb').html(bb_asset[asset_name])
        if (asset_name == 'ltc' || asset_name == 'eth') {
            var price_in_btc = bb_rate[asset_name + '_btc'][base_side];
            var btc_rate = bb_rate['btc_jpy'][base_side];
            total_asset_in_jpy += parseFloat(price_in_btc * btc_rate * bb_asset[asset_name]);
           
            
        } else if (asset_name == 'jpy') {
            total_asset_in_jpy += parseFloat(bb_asset[asset_name]);
        } else {
            
            var price_in_jpy = bb_rate[asset_name + '_jpy'][base_side];
           
            total_asset_in_jpy += parseFloat(price_in_jpy * bb_asset[asset_name]);
        }
    });
  
    $total_asset_bb.html(parseInt(total_asset_in_jpy));

    $('#jpy_cc').html(cc_asset.jpy);
    $('#btc_cc').html(cc_asset.btc);
    $('#eth_cc').html(cc_asset.eth);
    $('#etc_cc').html(cc_asset.etc);
    $('#lsk_cc').html(cc_asset.lsk);
    $('#fct_cc').html(cc_asset.fct);
    $('#xrp_cc').html(cc_asset.xrp);
    $('#xem_cc').html(cc_asset.xem);
    $('#ltc_cc').html(cc_asset.ltc);
    $('#bcc_cc').html(cc_asset.bch);    
}
