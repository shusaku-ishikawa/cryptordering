<template>
  <div>
    <fieldset>
      <legend align="left">通知切り替え</legend>
      <span>
        通知設定
      </span>
      <CustomToggleSwitch
        :caption="{ on: 'ON', off: 'OFF' }"
        v-model="userSettings.notify_if_filled"
      />
      <span>
        アラートメール通知
      </span>
      <CustomToggleSwitch
        :caption="{ on: 'ON', off: 'OFF' }"
        v-model="userSettings.use_alert"
      />
    </fieldset>
    <div>
      <div
        class="processing"
        v-show="processing"
      ></div>
      <div>
        <fieldset>
          <legend align="left">内容設定</legend>
          <CustomSelect
            placeholder="取引所"
            name="market"
            v-model="register.form.market"
            :options="register.options.markets"
            v-on:change="onMarketChange"
            :active="!processing"
          />
          <CustomSelect
            placeholder="通貨"
            name="symbol"
            v-model="register.form.symbol"
            :options="register.options.symbols"
            v-on:change="onSymbolChange"
            :active="!processing"
          />
          <CustomNumberInput
            prepend_placeholder="通知レート"
            :append_placeholder="quoteCurrency"
            name="rate"
            type="number"
            v-model.number="register.form.rate"
            :active="!processing"
          />
          <CustomTextInputPrependPlaceholder
            prepend_placeholder="コメント"
            v-model="register.form.comment"
            :active="!processing"
          />
          <div
            class="btn_wrapper"
          >
            <v-btn
              color="teal"
              v-on:click="createAlert"
              :disabled="processing"
            >
              登録
            </v-btn>
          </div>
        </fieldset>
      </div>
    </div>
    <fieldset>
      <legend align="left">検索設定</legend>
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
    </fieldset>
    <div style="height: 20px;"></div>
    <AlertPageCard
      v-for='(alert, index) in data'
      :key="index"
      :alert="alert"
      v-on:delete="deleteAlert"
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
    color: white;

  }
  span {
    display:block;
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
import CustomTextInputPrependPlaceholder from './components/CustomTextInputPrependPlaceholder'
import AlertPageCard from './components/AlertPageCard'
import CustomToggleSwitch from './components/CustomToggleSwitch'
import CustomPagination from './components/CustomPagination'
export default {
  components: {
    CustomSelect,
    CustomNumberInput,
    CustomTextInputPrependPlaceholder,
    AlertPageCard,
    CustomToggleSwitch,
    CustomPagination
  },
  data () {
    return {
      processing: false,
      userSettings: {
        use_alert: null,
        notify_if_filled: null
      },
      register: {
        form: {
          market: '',
          symbol: '',
          rate: 0,
          comment: ''
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
          ]
        }
      },
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
        length: 2,
        page: 1
      }
    }
  },
  computed: {
    quoteCurrency: function () {
      return this.register.form.symbol.split('/')[1]
    }
  },
  watch: {
    'pagination.page': async function (page) {
      await this.fetchData(page, this.searchCondition.market, this.searchCondition.symbol)
    }
  },
  methods: {
    async onMarketChange (value) {
      if (value === 'bitbank') {
        this.register.options.symbols = [
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
        this.register.options.symbols = [
          {value: 'BTC/JPY', text: 'BTC/JPY'}
        ]
      }
      await this.updateTicker(value, this.register.form.symbol)
    },
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
    async onSymbolChange (value) {
      await this.updateTicker(this.register.form.market, value)
    },
    async onSearchSymbolChange (value) {
      await this.fetchData(1, this.searchCondition.market, value)
    },
    async patchUserSettings () {
      this.$emit('loading', true)
      try {
        await this.$store.dispatch(
          'http/patch',
          { url: this.$store.getters['auth/userInfoPostUrl'], data: this.userSettings },
          { root: true }
        )
        this.flash('登録情報を更新しました', 'success', {
          timeout: 1500
        })
      } catch (err) {
        console.log(err.response.data)
        this.flash('登録情報の更新に失敗しました', 'error', {
          timeout: 1500
        })
      }
      this.$emit('loading', true)
    },
    async fetchData (page, market, symbol) {
      this.$emit('loading', true)
      let pagedUrl = 'alerts?market=' + market + '&symbol=' + symbol + '&page=' + page
      try {
        let result = await this.$store.dispatch(
          'http/get',
          { url: pagedUrl },
          { root: true }
        )
        this.pagination.length = result.data.page_count
        this.data = result.data.result
        this.userSettings.use_alert = result.data.user_settings.use_alert
        this.userSettings.notify_if_filled = result.data.user_settings.notify_if_filled
      } catch (err) {
        this.flash(err, 'error', {
          timeout: 1500
        })
      }
      this.$emit('loading', false)
    },
    async deleteAlert (id) {
      let url_ = 'alerts/' + id + '/'
      try {
        await this.$store.dispatch(
          'http/delete',
          { url: url_ },
          { root: true }
        )
        this.flash('通知設定を解除しました', 'success', {
          timeout: 1500
        })
      } catch (err) {
        this.flash(err, 'error', {
          timeout: 1500
        })
      }
      await this.fetchData(this.pagination.page, this.searchCondition.market, this.searchCondition.symbol)
    },
    async updateTicker (market, symbol) {
      this.$emit('loading', true)
      try {
        let result = await this.$store.dispatch(
          'http/get',
          { url: 'ticker?market=' + market + '&symbol=' + symbol },
          { root: true }
        )
        this.register.form.rate = parseFloat(result.data.last)
      } catch (err) {
        console.log(err.response)
        console.log(err)
      }
      this.$emit('loading', false)
      
    },
    async createAlert () {
      this.processing = true
      let url_ = 'alerts/'
      try {
        await this.$store.dispatch(
          'http/post',
          { url: url_, data: this.register.form },
          { root: true }
        )
        this.flash('通知設定を追加しました', 'success', {
          timeout: 1500
        })
      } catch (err) {
        if (err.response.status === 400) {
          console.log(err.response.data)
        }
        this.flash(err, 'error', {
          timeout: 1500
        })
      }
      this.processing = false
      await this.fetchData(this.pagination.page, this.searchCondition.market, this.searchCondition.symbol)
    }
  },
  async mounted () {
    await this.updateTicker(this.register.form.market, this.register.form.symbol)
    await this.fetchData(1, 'all', 'all')
  }
}
</script>
