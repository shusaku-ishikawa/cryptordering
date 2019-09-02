<template>
  <v-container>
    <div v-show="loading" class="loader">Now loading...</div>
    <v-row>
      <v-col
        md="6"
        offset-md="3"
        xs="12"
        v-show="!loading"
      >
        <div>
          <span>
            通知設定
          </span>
          <toggle-button
            :color="{checked: 'teal', unchecked: 'gray'}"
            :labels="{checked: 'ON', unchecked: 'OFF'}"
            :width="80"
            :height="25"
            :font-size="14"
          />
        </div>
        <div>
          <span>
            アラートメール通知
          </span>
          <toggle-button
            :value='false'
            :color="{checked: 'teal', unchecked: 'gray'}"
            :labels="{checked: 'ON', unchecked: 'OFF'}"
            :width="80"
            :height="25"
            :font-size="14"
          />
        </div>
        <fieldset>
          <legend>内容設定</legend>
          <CustomSelect
            placeholder="取引所"
            name="market"
            v-model="register.market"
            :options="register.options.markets"
            @change="onMarketChange"
          />
          <CustomSelect
            placeholder="通貨"
            name="pair"
            v-model="register.pair"
            :options="register.options.pairs"
          />
          <CustomNumberInput
            prepend_placeholder="通知レート"
            :append_placeholder="quoteCurrency"
            name="rate"
            type="number"
            v-model.number="register.rate"
          />
          <CustomTextInput
            prepend_placeholder="コメント"
            v-model="register.comment"
          />
          <div
            class="btn_wrapper"
          >
            <v-btn
              color="teal"
              v-on:click="createAlert"
            >
              登録
            </v-btn>
          </div>
        </fieldset>
        <CustomSelect
          placeholder="検索取引所"
          name="search_market"
          v-model="searchCondition.market"
          :options="searchCondition.options.markets"
          @change="onSearchMarketChange"
        />
        <CustomSelect
          placeholder="検索通貨"
          name="search_pair"
          v-model="searchCondition.pair"
          :options="searchCondition.options.pairs"
        />
        <AlertPageCard
          v-for='(alert, index) in data'
          :key="index"
          :id="alert.id"
          :market="alert.market"
          :pair="alert.pair"
          :rate="alert.rate"
          :comment="alert.comment"
          v-on:delete="deleteAlert"
        />
         <v-pagination
          v-show="pagination.length > 1"
          v-model="pagination.page"
          :circle="pagination.circle"
          :disabled="pagination.disabled"
          :length="pagination.length"
          :next-icon="pagination.nextIcon"
          :prev-icon="pagination.prevIcon"
        />
        <p
          class="alert"
          v-if="pagination.length === 0"
        >
          通知設定がありません
        </p>
      </v-col>
    </v-row>
  </v-container>
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
import CustomSelect from './form_components/CustomSelect'
import CustomNumberInput from './form_components/CustomNumberInput'
import CustomTextInput from './form_components/CustomTextInput'
import AlertPageCard from './sub_components/AlertPageCard'

export default {
  components: {
    CustomSelect,
    CustomNumberInput,
    CustomTextInput,
    AlertPageCard
  },
  data () {
    return {
      loading: true,
      register: {
        market: '',
        pair: '',
        rate: 0,
        comment: '',
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
          ]
        }
      },
      searchCondition: {
        market: '',
        pair: '',
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
          ]
        }
      },
      data: [],
      pagination: {
        circle: false,
        disabled: false,
        length: 10,
        nextIcon: 'navigate_next',
        nextIcons: ['navigate_next', 'arrow_forward', 'arrow_right', 'chevron_right'],
        prevIcon: 'navigate_before',
        prevIcons: ['navigate_before', 'arrow_back', 'arrow_left', 'chevron_left'],
        page: 1
      }
    }
  },
  computed: {
    totalVisible: function () {
      if (this.pagination.length < 10) {
        return this.pagination.length
      } else {
        return 10
      }
    },
    quoteCurrency: function () {
      return this.register.pair.split('_')[1]
    }
  },
  methods: {
    async onMarketChange (value) {
      if (value === 'bitbank') {
        this.register.options.pairs = [
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
        this.register.options.pairs = [
          {value: 'btc_jpy', text: 'BTC/JPY'}
        ]
      }
    },
    async onSearchMarketChange (value) {
      if (value === 'bitbank') {
        this.searchCondition.options.pairs = [
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
        this.searchCondition.options.pairs = [
          {value: 'btc_jpy', text: 'BTC/JPY'}
        ]
      }
    },
    async fetchData (page, market, pair) {
      let pagedUrl = 'alerts?market=' + market + '&pair=' + pair + '?page=' + page 
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
    },
    async deleteAlert (id) {
      let url_ = 'alerts/' + id + '/'
      try {
        let result = await this.$store.dispatch(
          'http/delete',
          { url: url_ },
          { root: true }
        )
      } catch (err) {
        this.flash(err, 'error', {
          timeout: 1500
        })
      }
    },
    async createAlert () {
      let url_ = 'alerts/'
      let data_ = {
        market: this.register.market,
        pair: this.register.pair,
        rate: this.register.rate,
        comment: this.register.comment
      }
      try {
        let result = await this.$store.dispatch(
          'http/post',
          { url: url_, data: data_ },
          { root: true }
        )
      } catch (err) {
        if (err.response.status === 400) {
          console.log(err.response.data)
        }
        this.flash(err, 'error', {
          timeout: 1500
        })
      }
    }
  },
  async created () {
    this.loading = true
    await this.fetchData(1, 'bitbank', 'btc_jpy')
    this.loading = false
  }
}
</script>
