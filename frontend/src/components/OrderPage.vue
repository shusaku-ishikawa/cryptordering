<template>
<v-container>
  <v-row>
    <v-col
      md="6"
      offset-md="3"
      xs="12"
    >
    <CustomSelect
      placeholder="取引所"
      name="market"
      v-model="form.market"
      :options="form.options.markets"
      @change="onMarketChange"
    />
    <CustomSelect
      placeholder="取引通貨"
      name="pair"
      v-model="form.pair"
      :options="form.options.pairs"
      @change="onPairChange"
    />
    <CustomSelect
      placeholder="特殊注文"
      name="special_order"
      v-model="form.special_order"
      :options="form.options.special_orders"
      @change="onSpecialOrderChange"
    />
    <OrderPageForm
      v-show="showOrder1"
      position='new_order'
      label="新規注文"
      :pair="form.pair"
      :base_asset="asset.base"
      :quote_asset="asset.quote"
      :sell_rate="rate.sell"
      :buy_rate="rate.buy"
    />
    <OrderPageForm
      v-show="showOrder2"
      position='settle_1'
      label="決済注文1"
      :pair="form.pair"
      :base_asset="asset.base"
      :quote_asset="asset.quote"
      :sell_rate="rate.sell"
      :buy_rate="rate.buy"

    />
    <OrderPageForm
      v-show="showOrder3"
      position='settle_2'
      label="決済注文2"
      :pair="form.pair"
      :base_asset="asset.base"
      :quote_asset="asset.quote"
      :sell_rate="rate.sell"
      :buy_rate="rate.buy"
    />
    </v-col>
  </v-row>
</v-container>
</template>

<script>
import CustomSelect from './form_components/CustomSelect'
import OrderPageForm from './sub_components/OrderPageForm'

export default {
  data () {
    return {
      form: {
        market: 'bitbank',
        pair: 'btc_jpy',
        special_order: '',
        side: '',
        options: {
          markets: [
            {text: 'bitbank', value: 'bitbank'},
            {text: 'coincheck', value: 'coincheck'}
          ],
          pairs: [
            {value: 'btc_jpy', text: 'BTC/JPY'},
            {value: 'xrp_jpy', text: 'XRP/JPY'},
            {value: 'ltc_btc', text: 'LTC/BTC'},
            {value: 'eth_btc', text: 'ETH/BTC'},
            {value: 'mona_jpy', text: 'MONA/JPY'},
            {value: 'mona_btc', text: 'MONA/BTC'},
            {value: 'bcc_jpy', text: 'BCC/JPY'},
            {value: 'bcc_btc', text: 'BCC/BTC'}
          ],
          special_orders: [
            {text: 'SINGLE', value: 'SINGLE'},
            {text: 'IFD', value: 'IFD'},
            {text: 'OCO', value: 'OCO'},
            {text: 'IFDOCO', value: 'IFDOCO'}
          ]
        }
      },
      asset: {
        base: 0,
        quote: 0
      },
      rate: {
        sell: 0,
        buy: 0
      }
    }
  },
  async created () {
    let defaultMarket = 'bitbank'
    let defaultPair = 'btc_jpy'
    await this.updateAsset(defaultMarket, defaultPair)
    await this.updateTicker(defaultMarket, defaultPair)
  },
  components: { CustomSelect, OrderPageForm },
  computed: {
    showOrder1: function () {
      return this.form.special_order !== 'OCO'
    },
    showOrder2: function () {
      return this.form.special_order !== 'SINGLE'
    },
    showOrder3: function () {
      return (this.form.special_order === 'OCO' || this.form.special_order === 'IFDOCO')
    },
    baseCurrency: function () {
      return this.form.pair.split('_')[0]
    },
    quoteCurrency: function () {
      return this.form.pair.split('_')[1]
    }
  },
  methods: {
    async updateAsset (market, pair) {
      try {
        let result = await this.$store.dispatch(
          'http/get',
          { url: 'assets?market=' + market },
          { root: true }
        )
        result.data.assets.forEach(element => {
          if (element.asset === this.baseCurrency) {
            this.asset.base = parseFloat(element.onhand_amount)
          } else if (element.asset === this.quoteCurrency ) {
            this.asset.quote = parseFloat(element.onhand_amount)
          }
        });
      } catch (err) {
        if (err.response.status == 503) {
          this.flash(err.response.data, 'error', {
            timeout: 1500
          })
        }
      }
    },
    async updateTicker (market, pair) {
      try {
        let result = await this.$store.dispatch(
          'http/get',
          { url: 'ticker?market=' + market + '&pair=' + pair },
          { root: true }
        )
        if (market === 'bitbank') {
          this.rate.sell = parseFloat(result.data.sell)
          this.rate.buy = parseFloat(result.data.buy)
          console.log(result.data)
        } else if (market === 'coincheck') {
          this.rate.sell = parseFloat(result.data.bid)
          this.rate.buy = parseFloat(result.data.ask)
        }  
      } catch (err) {
        console.log(err)
      }
    },
    async onMarketChange (value) {
      if (value === 'bitbank') {
        this.form.options.pairs = [
          {value: 'btc_jpy', text: 'BTC/JPY'},
          {value: 'xrp_jpy', text: 'XRP/JPY'},
          {value: 'ltc_btc', text: 'LTC/BTC'},
          {value: 'eth_btc', text: 'ETH/BTC'},
          {value: 'mona_jpy', text: 'MONA/JPY'},
          {value: 'mona_btc', text: 'MONA/BTC'},
          {value: 'bcc_jpy', text: 'BCC/JPY'},
          {value: 'bcc_btc', text: 'BCC/BTC'}
        ]
      } else if (value === 'coincheck') {
        this.form.options.pairs = [
          {value: 'btc_jpy', text: 'BTC/JPY'}
        ]
      }
      this.updateAsset(value, this.form.pair)
      this.updateTicker(value, this.form.pair)
    },
    async onPairChange (value) {
      this.updateAsset(this.form.market, value)
      this.updateTicker(this.form.market, value)
    },
    onSpecialOrderChange (value) {
    }
  }
}
</script>
