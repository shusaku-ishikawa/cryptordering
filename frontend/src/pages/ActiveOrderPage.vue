<template>
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
    <ActiveOrderPageCard
      v-for='(relation, index) in data'
      :key="index"
      :relation="relation"
      v-on:operation="onOperation"
    />
    <p
      v-show="data.length == 0"
    >
      アクティブな注文はありません
    </p>
    <CustomPagination
      v-show="data.length > 0"
      v-model="pagination.page"
      :length="pagination.length"
    />
  </div>
</template>
<style scoped>
  p {
    color: red
  }
</style>
<script>
import ActiveOrderPageCard from './components/ActiveOrderPageCard'
import CustomSelect from './components/CustomSelect'
import CustomNumberInput from './components/CustomNumberInput'
import CustomPagination from './components/CustomPagination'
import Modal from './components/Modal'

export default {
  components: {
    ActiveOrderPageCard,
    CustomSelect,
    CustomNumberInput,
    CustomPagination,
    Modal
  },
  data () {
    return {
      modal: false,
      operation: {},
      data: [],
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
      pagination: {
        length: 10,
        page: 1
      }
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
      let pagedUrl = 'relations?market=' + market + '&symbol=' + symbol + '&page=' + page
      try {
        let result = await this.$store.dispatch(
          'http/get',
          { url: pagedUrl },
          { root: true }
        )
        console.log(this.data)
        this.data = result.data.result
        this.pagination.length = result.data.page_count
        this.pagination.page = page
      } catch (err) {
        this.flash(err, 'error', {
          timeout: 1500
        })
      }
      this.$emit('loading', false)
    },
    async onOperation (operation) {
      this.operation = operation
      this.modal = true
    },
    async onModalConfirm () {
      this.modal = false
      await this.fetchData(this.pagination.page, this.searchCondition.market, this.searchCondition.symbol)
    }
  },
  async created () {
    await this.fetchData(1, 'bitbank', 'BTC/JPY')
    this.pagination.page = 1
  }
}
</script>
