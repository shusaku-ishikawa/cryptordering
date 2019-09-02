<template>
<fieldset>
  <legend>{{ label }}</legend>
  <div class="side_wrapper">
    <toggle-button
      :value='false'
      :color="{checked: 'teal', unchecked: 'red'}"
      :labels="{checked: '売り', unchecked: '買い'}"
      :width="80"
      :height="25"
      :font-size="14"
      @change="onSideChange"
    />
  </div>
  <div class="order_type_wrapper">
    <CustomSelect
      placeholder="注文方法"
      name="order_type"
      :options="form.options.order_types"
      v-model="form.order_type"
      v-on:change="onOrderTypeChange"
    />
  </div>
  <CustomNumberInput
    prepend_placeholder="指値価格"
    :append_placeholder="quoteCurrency"
    name="limit_price"
    type="number"
    v-model.number="form.limit_price"
    :visible="isLimitOrder"
    v-show="isLimitOrder"
  />
  <CustomNumberInput
    prepend_placeholder="逆指値価格"
    :append_placeholder="quoteCurrency"
    name="stop_price"
    type="number"
    v-model.number="form.stop_price"
    v-if="isStopOrder"
  />
  <CustomNumberInput
    prepend_placeholder="トレール幅"
    :append_placeholder="quoteCurrency"
    name="trail_gap"
    type="number"
    v-model.number="form.trail_gap"
    v-if="isTrailOrder"
  />
  <CustomNumberInput
    prepend_placeholder="数量"
    :append_placeholder="baseCurrency"
    name="quantity"
    type="number"
    v-model.number="form.quantity"
  />
  <CustomNumberInput
    prepend_placeholder="数量"
    :append_placeholder="quoteCurrency"
    type="number"
    name="quote_quantity"
    v-bind:value="quoteQuantity"
    @change="onQuoteQuantityChange"
  />
  <v-slider
    v-bind:value="assetRate"
    v-on:change="onRateChange"
    :color="sidecolor"
    height="20"
    append-icon="exposure_plus_1"
    prepend-icon="exposure_minus_1"
    @click:append="increment"
    @click:prepend="decrement"
  ></v-slider>
  <OrderQtyRateDisplay
    v-bind:rate="assetRate"
    v-bind:error="form.rate_error"
  />
  <OrderQtyPercButtons
    :buttonColor="sidecolor"
    v-on:click="handleRateButtonClick"
  />
</fieldset>
</template>
<style scoped>
  * {
    color:white
  }
  fieldset {
    padding: 10px;
  }
  div.side_wrapper {
    display: inline-block;
    width: 25%;
    margin: none;
  }
  div.order_type_wrapper {
    display: inline-block;
    width: 73%;
    margin: none;
    padding: none;
  }
</style>
<script>
import CustomSelect from '../form_components/CustomSelect'
import CustomNumberInput from '../form_components/CustomNumberInput'
import OrderQtyPercButtons from '../form_components/OrderQtyPercButtons'
import OrderQtyRateDisplay from '../form_components/OrderQtyRateDisplay'
export default {
  name: 'OrderPageForm',
  components: { CustomSelect, CustomNumberInput, OrderQtyPercButtons, OrderQtyRateDisplay },
  data () {
    return {
      form: {
        side: '',
        order_type: '',
        limit_price: 0,
        stop_price: 0,
        trail_gap: 0,
        quantity: 0,
        rate_error: false,
        options: {
          order_types: [
            {text: '成行', value: 'market'},
            {text: '指値', value: 'limit'},
            {text: '逆指値', value: 'stop_market'},
            {text: 'ストップリミット', value: 'stop_limit'},
            {text: 'トレール', value: 'trail'}
          ]
        }
      }
    }
  },
  props: {
    position: { type: String, require: true },
    label: { type: String, require: true },
    pair: { type: String, require: true },
    base_asset: { type: Number, require: true },
    quote_asset: { type: Number, require: true },
    sell_rate: { type: Number, require: true },
    buy_rate: { type: Number, require: true }
  },
  computed: {
    sidecolor: function () {
      if (this.form.side === 'sell') {
        return 'teal'
      } else {
        return 'red'
      }
    },
    assetRate: function () {
      if (this.form.side === 'sell') {
        return parseInt((this.form.quantity / this.base_asset) * 100)
      } else {
        return parseInt((this.quoteQuantity / this.quote_asset) * 100)
      }
    },
    exchangeRate: function () {
      if (this.isLimitOrder) {
        return this.form.limit_price
      } else {
        if (this.form.side === 'side') {
          return this.sell_rate
        } else {
          return this.buy_rate
        }
      }
    },
    quoteQuantity: function () {
      if (this.exchangeRate > 0) {
        return this.form.quantity * this.exchangeRate
      } else {
        return 0
      }
    },
    baseCurrency: function () {
      return this.pair.split('_')[0]
    },
    quoteCurrency: function () {
      return this.pair.split('_')[1]
    },
    isLimitOrder: function () {
      return this.form.order_type.includes('limit')
    },
    isStopOrder: function () {
      return this.form.order_type.includes('stop')
    },
    isTrailOrder: function () {
      return this.form.order_type.includes('trail')
    }
  },
  watch: {
  },
  methods: {
    onOrderTypeChange: function (value) {
      let init_val
      if (this.form.side === 'side') {
        init_val = this.sell_rate 
      } else {
        init_val = this.buy_rate
      }
      if (this.isLimitOrder) { 
        this.form.limit_price = init_val
      }
      if (this.isStopOrder) {
        this.form.stop_price = init_val
      }
    },
    onSideChange: function (obj) {
      if (obj.value) {
        // sell
        this.form.side = 'sell'
      } else {
        this.form.side = 'buy'
      }
    },
    handleRateButtonClick: function (val) {
      this.onRateChange(val)
    },
    onRateChange: function (val) {
      if (this.form.side === 'sell') {
        this.form.quantity = (val / 100) * this.base_asset
      } else {
        this.form.quantity = (val / 100) * this.quote_asset / this.exchangeRate
      }
    },
    onQuoteQuantityChange: function (val) {

    },
    increment: function () {
      let unit
      if (this.form.side === 'sell') {
        unit = this.base_asset * 0.01
        this.form.quantity += unit
      } else {
        unit = this.quote_asset / 100
        this.form.quantity += unit / this.exchangeRate  
      }
    },
    decrement: function () {
      let unit
      if (this.form.side === 'sell') {
        unit = this.base_asset * 0.01
      } else {
        unit = this.exchangeRate * this.form.quantity / 100
      }
      this.form.quantity -= unit     
    }
  }
}
</script>
