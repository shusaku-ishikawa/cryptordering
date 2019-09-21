<template>
  <div>
    <div
      class="processing"
      v-show="processing"
    ></div>
    <div>
      <Modal
        v-show="modal"
        :isError="!operation.isSuccess"
        v-on:close="onModalConfirm"
      >
        <template
          v-slot:body
        >
          {{ operation.message }}
        </template>
      </Modal>
      <CustomSelect
        placeholder="取引所"
        name="market"
        v-model="form.data.market"
        :options="form.options.markets"
        @change="onMarketChange"
        :active="!processing"
      />
      <CustomSelect
        placeholder="取引通貨"
        name="symbol"
        v-model="form.data.symbol"
        :options="form.options.symbols"
        @change="onSymbolChange"
        :active="!processing"
      />
      <CustomSelect
        placeholder="特殊注文"
        name="special_order"
        v-model="form.data.special_order"
        :options="form.options.special_orders"
        @change="onSpecialOrderChange"
        :active="!processing"
      />
      <OrderPageForm
        v-show="showOrder1"
        position='new_order'
        label="新規注文"
        :symbol="form.data.symbol"
        :baseAsset="asset.base"
        :quoteAsset="asset.quote"
        :sellRate="rate.sell"
        :buyRate="rate.buy"
        v-on:change="onOrder1Change($event)"
        :active="!processing"
      />
      <OrderPageForm
        v-show="showOrder2"
        position='settle_1'
        label="決済注文1"
        :symbol="form.data.symbol"
        :baseAsset="ifdVirtualAsset.base"
        :quoteAsset="ifdVirtualAsset.quote"
        :sellRate="rate.sell"
        :buyRate="rate.buy"
        :active="!processing"
        v-on:change="onOrder2Change($event)"
        
      />
      <OrderPageForm
        v-show="showOrder3"
        position='settle_2'
        label="決済注文2"
        :symbol="form.data.symbol"
        :baseAsset="ifdVirtualAsset.base"
        :quoteAsset="ifdVirtualAsset.quote"
        :sellRate="rate.sell"
        :buyRate="rate.buy"
        :active="!processing"
        v-on:change="onOrder3Change($event)"
      />
      <v-btn
        block
        class="order_button"
        color="teal"
        v-on:click="placeOrder"
        :disabled="processing"
      >
        注文
      </v-btn>
    </div>
  </div>
</template>
<style scoped>
  .order_button {
    margin-top: 10px;
  }
</style>
<script>
import CustomSelect from './components/CustomSelect'
import OrderPageForm from './components/OrderPageForm'
import Modal from './components/Modal'
export default {
  data () {
    return {
      processing: false,
      modal: false,
      operation: {
        isError: false,
        message: ''
      },
      form: {
        data: {
          market: 'bitbank',
          symbol: 'BTC/JPY',
          special_order: '',
          order_1: null,
          order_2: null,
          order_3: null
        },
        options: {
          markets: [
            {text: 'bitbank', value: 'bitbank'},
            {text: 'coincheck', value: 'coincheck'}
          ],
          symbols: [
            {value: 'BTC/JPY', text: 'BTC/JPY'},
            {value: 'XRP/JPY', text: 'XRP/JPY'},
            {value: 'LTC/BTC', text: 'LTC/BTC'},
            {value: 'ETH/BTC', text: 'ETH/BTC'},
            {value: 'MONA/JPY', text: 'MONA/JPY'},
            {value: 'MONA/BTC', text: 'MONA/BTC'},
            {value: 'BCC/JPY', text: 'BCC/JPY'},
            {value: 'BCC/BTC', text: 'BCC/BTC'}
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
    let defaultSymbol = 'BTC/JPY'
    await this.updateAsset(defaultMarket, defaultSymbol)
    await this.updateTicker(defaultMarket, defaultSymbol)
    this.$emit('loading', false)
  },
  components: {
    CustomSelect,
    OrderPageForm,
    Modal
  },
  computed: {
    showOrder1: function () {
      return this.form.data.special_order !== 'OCO'
    },
    showOrder2: function () {
      return this.form.data.special_order !== 'SINGLE'
    },
    showOrder3: function () {
      return (this.form.data.special_order === 'OCO' || this.form.data.special_order === 'IFDOCO')
    },
    baseCurrency: function () {
      return this.form.data.symbol.split('/')[0]
    },
    quoteCurrency: function () {
      return this.form.data.symbol.split('/')[1]
    },
    ifdVirtualAsset: function () {
      
      if (this.form.data.special_order.includes('IFD')) {
        if (this.form.data.order_1.side === 'sell') {
          let exchangeRate = this.form.data.order_1.type.includes('limit') ? this.form.data.order_1.price : this.rate.sell
          let baseLost = this.form.data.order_1.amount
          let quoteAcquired = exchangeRate * baseLost
          return { base: this.asset.base - baseLost, quote: this.asset.quote + quoteAcquired }
        } else {
          let exchangeRate = this.form.data.order_1.type.includes('limit') ? this.form.data.order_1.price : this.rate.buy
          let baseAcquired = this.form.data.order_1.amount
          let quoteLost = exchangeRate * baseAcquired
          return { base: this.asset.base + baseAcquired, quote: this.asset.quote - quoteLost }
        }
      } else {
        return this.asset
      }
    }
  },
  methods: {
    async updateAsset (market, symbol) {
      try {
        let result = await this.$store.dispatch(
          'http/get',
          { url: 'assets?market=' + market },
          { root: true }
        )
        console.log(result.data)
        this.asset.base = result.data[this.baseCurrency]
        this.asset.quote = result.data[this.quoteCurrency]
      } catch (err) {
        console.log(err.response)
        if (err.response.status === 503) {
          this.flash(err.response.data, 'error', {
            timeout: 1500
          })
        }
      }
    },
    async updateTicker (market, symbol) {
      try {
        let result = await this.$store.dispatch(
          'http/get',
          { url: 'ticker?market=' + market + '&symbol=' + symbol },
          { root: true }
        )
        console.log(result.data)
        this.rate.sell = parseFloat(result.data.bid)
        this.rate.buy = parseFloat(result.data.ask)
      } catch (err) {
        console.log(err.response)
        console.log(err)
      }
    },
    async onMarketChange (value) {
      if (value === 'bitbank') {
        this.form.options.symbols = [
          {value: 'BTC/JPY', text: 'BTC/JPY'},
          {value: 'XRP/JPY', text: 'XRP/JPY'},
          {value: 'LTC/BTC', text: 'LTC/BTC'},
          {value: 'ETH/BTC', text: 'ETH/BTC'},
          {value: 'MONA/JPY', text: 'MONA/JPY'},
          {value: 'MONA/BTC', text: 'MONA/BTC'},
          {value: 'BCC/JPY', text: 'BCC/JPY'},
          {value: 'BCC/BTC', text: 'BCC/BTC'}
        ]
      } else if (value === 'coincheck') {
        this.form.options.symbols = [
          {value: 'BTC/JPY', text: 'BTC/JPY'}
        ]
        this.form.data.symbol = 'BTC/JPY'
        alert(this.form.data.symbol)
      }
      this.updateAsset(value, this.form.data.symbol)
      this.updateTicker(value, this.form.data.symbol)
    },
    async onSymbolChange (value) {
      this.updateAsset(this.form.data.market, value)
      this.updateTicker(this.form.data.market, value)
    },
    onSpecialOrderChange (value) {
    },
    onOrder1Change (event) {
      this.form.data.order_1 = event
    },
    onOrder2Change (event) {
      this.form.data.order_2 = event
    },
    onOrder3Change (event) {
      this.form.data.order_3 = event
    },
    async placeOrder () {
      this.processing = true
      try {
        await this.$store.dispatch(
          'http/post',
          { url: 'relations/', data: this.form.data },
          { root: true }
        )
        this.operation = {
          isSuccess: true,
          message: '注文が完了しました'
        }
      } catch (err) {
        const { status, data } = err.response
        if (status === 400) {
          if (data.non_field_errors) {
            this.operation = {
              isSuccess: false,
              message: data.non_field_errors[0]
            }
          }
        }
      }
      this.modal = true
    },
    onModalConfirm: function () {
      this.modal = false
      this.processing = false
    
    }
  }
}
</script>
