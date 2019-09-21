<template>
  <fieldset
    v-bind:class="{ inactive: !active }"
  >
    <legend align="left">{{ label }}</legend>
    <CustomToggleSwitch
      :caption="{ off: '買い', on: '売り' }"
      :value="sideBool"
      v-on:input="onSideChange"
      :active="active"
    />
    <CustomSelect
        placeholder="注文方法"
        name="type"
        :options="form.options.types"
        v-model="form.data.type"
        v-on:change="ontypeChange"
        :active="active"
    />
    <CustomNumberInput
      prepend_placeholder="指値価格"
      :append_placeholder="quoteCurrency"
      name="price"
      type="number"
      v-model.number="form.data.price"
      :visible="isLimitOrder"
      v-show="isLimitOrder"
      :active="active"
    />
    <CustomNumberInput
      prepend_placeholder="逆指値価格"
      :append_placeholder="quoteCurrency"
      name="stop_price"
      type="number"
      v-model.number="form.data.stop_price"
      v-if="isStopOrder"
      :active="active"
    />
    <CustomNumberInput
      prepend_placeholder="トレール幅"
      :append_placeholder="quoteCurrency"
      name="trail_gap"
      type="number"
      v-model.number="form.data.trail_width"
      v-if="isTrailOrder"
      :active="active"
    />
    <CustomNumberInput
      prepend_placeholder="数量"
      :append_placeholder="baseCurrency"
      name="quantity"
      type="number"
      v-model.number="form.data.amount"
      :active="active"
    />
    <CustomNumberInput
      prepend_placeholder="数量"
      :append_placeholder="quoteCurrency"
      type="number"
      name="quote_quantity"
      v-bind:value="quoteQuantity"
      @change="onQuoteQuantityChange"
      :active="active"
    />
    <v-btn
      v-on:click="decrement"
      :color="sidecolor"
      :disabled="!active"
      class="decrement-button"
    >
      -1
    </v-btn>
    <v-btn
      v-on:click="increment"
      :color="sidecolor"
      class="increment-button"
      :disabled="!active"
    >
      +1
    </v-btn>
    <v-slider
      style="clear: both;"
      v-bind:value="assetRate"
      v-on:change="onRateChange"
      :color="sidecolor"
      height="20"
      :disabled="!active"
    ></v-slider>
    <OrderPageFormAssetRate
      v-bind:rate="assetRate"
      :active="active"
    />
    <OrderPageFormAmountPercentButtons
      :buttonColor="sidecolor"
      v-on:click="handleRateButtonClick"
      :active="active"
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
  button.decrement-button {
    float: left
  }
  button.increment-button {
    float: right
  }
  fieldset.inactive legend {
    color: gray
  }

</style>
<script>
import CustomSelect from './CustomSelect'
import CustomNumberInput from './CustomNumberInput'
import CustomToggleSwitch from './CustomToggleSwitch'
import OrderPageFormAmountPercentButtons from './OrderPageFormAmountPercentButtons'
import OrderPageFormAssetRate from './OrderPageFormAssetRate'

export default {
  name: 'OrderPageForm',
  components: {
    CustomSelect,
    CustomNumberInput,
    OrderPageFormAmountPercentButtons,
    OrderPageFormAssetRate,
    CustomToggleSwitch
  },
  data () {
    return {
      precision: 5,
      form: {
        data: {
          side: 'buy',
          type: '',
          price: 0,
          stop_price: 0,
          trail_width: 0,
          amount: 0
        },
        options: {
          types: [
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
    symbol: { type: String, require: true },
    baseAsset: { type: Number, require: true },
    quoteAsset: { type: Number, require: true },
    sellRate: { type: Number, require: true },
    buyRate: { type: Number, require: true },
    active: { type: Boolean, default: true }
  },
  created () {
    this.$emit('input', this.form.data)
  },
  computed: {
    sideBool: function () {
      if (this.form.data.side === 'sell') {
        return true
      } else {
        return false
      }
    },
    sidecolor: function () {
      if (this.form.data.side === 'sell') {
        return 'red'
      } else {
        return 'teal'
      }
    },
    assetRate: function () {
      if (this.form.data.side === 'sell') {
        return parseInt((this.form.data.amount / this.baseAsset) * 100)
      } else {
        return parseInt((this.quoteQuantity / this.quoteAsset) * 100)
      }
    },
    exchangeRate: function () {
      if (this.isLimitOrder) {
        return this.form.data.price
      } else {
        if (this.form.data.side === 'side') {
          return this.sellRate
        } else {
          return this.buyRate
        }
      }
    },
    quoteQuantity: function () {
      if (this.exchangeRate > 0) {
        return this.round(this.form.data.amount * this.exchangeRate, this.precision)
      } else {
        return 0
      }
    },
    baseCurrency: function () {
      return this.symbol.split('/')[0]
    },
    quoteCurrency: function () {
      return this.symbol.split('/')[1]
    },
    isLimitOrder: function () {
      return this.form.data.type.includes('limit')
    },
    isStopOrder: function () {
      return this.form.data.type.includes('stop')
    },
    isTrailOrder: function () {
      return this.form.data.type.includes('trail')
    }
  },
  watch: {
    'form.data.side': function () {
      this.$emit('change', this.form.data)
    },
    'form.data.type': function () {
      this.$emit('change', this.form.data)
    },
    'form.data.price': function () {
      this.$emit('change', this.form.data)
    },
    'form.data.stop_price': function () {
      this.$emit('change', this.form.data)
    },
    'form.data.trail_width': function () {
      this.$emit('change', this.form.data)
    },
    'form.data.amount': function () {
      this.$emit('change', this.form.data)
    }
  },
  methods: {
    ontypeChange: function (value) {
      let initVal
      if (this.form.data.side === 'side') {
        initVal = this.sellRate
      } else {
        initVal = this.buyRate
      }
      if (this.isLimitOrder) {
        this.form.data.price = initVal
      }
      if (this.isStopOrder) {
        this.form.data.stop_price = initVal
      }
    },
    onSideChange: function (value) {
      if (value) {
        // sell
        this.form.data.side = 'sell'
      } else {
        this.form.data.side = 'buy'
      }
    },
    handleRateButtonClick: function (val) {
      this.onRateChange(val)
    },
    round: function (value, decimals) {
      return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals)
    },
    onRateChange: function (val) {
      if (this.form.data.side === 'sell') {
        let raw = (val / 100) * this.baseAsset
        this.form.data.amount = this.round(raw, this.precision)
      } else {
        let raw = (val / 100) * this.quoteAsset / this.exchangeRate
        this.form.data.amount = this.round(raw, this.precision)
      }
    },
    onQuoteQuantityChange: function (val) {

    },
    increment: function () {
      let unit
      if (this.form.data.side === 'sell') {
        unit = this.baseAsset * 0.01
        this.form.data.amount = this.round(this.form.data.amount + unit, this.precision)
      } else {
        unit = this.quoteAsset / 100
        this.form.data.amount = this.round(this.form.data.amount + unit / this.exchangeRate, this.precision)
      }
    },
    decrement: function () {
      let unit
      if (this.form.data.side === 'sell') {
        unit = this.baseAsset * 0.01
      } else {
        unit = this.quoteAsset * 0.01 / this.exchangeRate
      }
      this.form.data.amount = this.round(this.form.data.amount - unit, this.precision)
    }
  }
}
</script>
