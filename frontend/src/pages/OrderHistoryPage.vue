<template>
  <div>
    <CustomSelect
      placeholder="検索取引所"
      name="search_market"
      v-model="searchCondition.market"
      :options="searchCondition.options.markets"
      v-on:change="onSearchMarketChange"
    />
    <CustomSelect
      placeholder="検索通貨"
      name="search_symbol"
      v-model="searchCondition.symbol"
      :options="searchCondition.options.symbols"
      v-on:change="onSearchSymbolChange"
    />
    <OrderHistoryPageCard
      v-for='(order, index) in data'
      :key="index"
      :order="order"
    />
    <CustomPagination
      v-show="data.length > 0"
      v-model="pagination.page"
      :length="pagination.length"
    />
    <p
      class="alert"
      v-if="data.length === 0"
    >
      通知設定がありません
    </p>
  </div>
</template>
<style scoped>
  fieldset {
    padding: 5px 10px;
  }
  legend {
    color: white
  }
  span {
    display:inline-block;
    width: 200px;
    text-align: left;
    color:white
  }
  p.alert {
    color:red
  }
  div.btn_wrapper {
    text-align:right;
  }
</style>
<script>
import CustomSelect from './components/CustomSelect'
import CustomNumberInput from './components/CustomNumberInput'
import CustomTextInput from './components/CustomTextInput'
import OrderHistoryPageCard from './components/OrderHistoryPageCard'
import CustomPagination from './components/CustomPagination'

export default {
  components: {
    CustomSelect,
    CustomNumberInput,
    CustomTextInput,
    OrderHistoryPageCard,
    CustomPagination
  },
  data () {
    return {
      searchCondition: {
        market: '',
        symbol: '',
        options: {
          markets: [
            {value: 'all', text: '全て'},
            {text: 'bitbank', value: 'bitbank'},
            {text: 'coincheck', value: 'coincheck'}
          ],
          symbols: [
            {value: 'all', text: '全て'},
            {value: 'BTC/JPY', text: 'BTC/JPY'},
            {value: 'XRP/JPY', text: 'XRP/JPY'},
            {value: 'LTC/BTC', text: 'LTC/BTC'},
            {value: 'ETH/BTC', text: 'ETH/BTC'},
            {value: 'MONA/JPY', text: 'MONA/JPY'},
            {value: 'MONA/BTC', text: 'MONA/BTC'},
            {value: 'BCC/JPY', text: 'BCC/JPY'},
            {value: 'BCC/BTC', text: 'BCC/BTC'}
          ]
        }
      },
      data: [],
      pagination: {
        length: 0,
        page: 1
      }
    }
  },
  computed: {
    quoteCurrency: function () {
      return this.register.symbol.split('_')[1]
    }
  },
  watch: {
    'pagination.page': async function (page) {
      await this.fetchData(page, this.searchCondition.market, this.searchCondition.symbol)
    }
  },
  methods: {
    async onSearchMarketChange (value) {
      if (value === 'bitbank') {
        this.searchCondition.options.symbols = [
          {value: 'all', text: '全て'},
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
        this.searchCondition.options.symbols = [
          {value: 'all', text: '全て'},
          {value: 'BTC/JPY', text: 'BTC/JPY'}
        ]
      }
      await this.fetchData(1, value, this.searchCondition.symbol)
    },
    async onSearchSymbolChange (value) {
      await this.fetchData(1, this.searchCondition.market, value)
    },
    async fetchData (page, market, symbol) {
      this.$emit('loading', true)
      let pagedUrl = 'history?market=' + market + '&symbol=' + symbol + '&page=' + page
      try {
        let result = await this.$store.dispatch(
          'http/get',
          { url: pagedUrl },
          { root: true }
        )
        this.data = result.data.result
        this.pagination.length = result.data.page_count
      } catch (err) {
        this.flash(err, 'error', {
          timeout: 1500
        })
      }
      this.$emit('loading', false)
    }
  },
  async created () {
    await this.fetchData(1, 'all', 'all')
  }
}
</script>
