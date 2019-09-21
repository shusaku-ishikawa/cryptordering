<template>
  <div>
    <fieldset>
      <legend>合計評価額</legend>
      <table>
        <tr>
          <th>JPY</th>
          <td>{{ parseInt(total) }}</td>
        </tr>
      </table>
    </fieldset>  
    <fieldset>
      <legend align="left">
        bitbank
      </legend>
        <span
          v-show="bb_error"
        >
          取得に失敗しました
        </span>
        <table
          v-show="!bb_error"
        >
          <thead>
            <tr>
              <th v-for="(header, index) in headers" :key="index">{{ header.text }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(value, key) in bb_data" :key="key">
              <td align="center">{{ key }}</td>
              <td align="center">{{ value }}</td>
            </tr>
          </tbody>
        </table>
      </fieldset>
      <fieldset>
        <legend align="left">
          coincheck
        </legend>
            <span
            v-show="cc_error"
          >
            取得に失敗しました
          </span>
          <table
          v-show="!cc_error"
          >
            <thead>
              <tr>
                <th v-for="(header, index) in headers" :key="index">{{ header.text }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(value, key) in cc_data" :key="key">
                <td align="center">{{ key }}</td>
                <td align="center">{{ value }}</td>
              </tr>
            </tbody>
          </table>
      </fieldset>
   </div>
</template>
<style scoped>
  table {
    color: white;
    width: 100%;
    border: none;
    border-collapse:collapse
  }
  thead tr {
    border-bottom: groove #444444 1px
  }
  tbody tr {
    border-bottom: groove darkgray 1px;
  }
  tbody tr:hover {
    background-color: #555555
  }
  td, th {
    padding-right: 20px;
    padding-left: 20px;
  }

  div.wrapper {
    align-items: center
  }
  legend {
    color: white
  }
  span {
    color:red
  }
</style>
<script>
export default {
  data () {
    return {
      headers: [
        { text: '通貨', value: 'asset' },
        { text: '残高', value: 'free' }
      ],
      total: 0,
      bb_data: [],
      bb_error: false,
      cc_data: [],
      cc_error: false
    }
  },
  methods: {
    async getTicker (market, symbol) {
      try {
        let result = await this.$store.dispatch(
          'http/get',
          { url: 'ticker/?market=' + market + '&symbol=' + symbol }
        )
        return result.data.last
      } catch (err) {

      }
    }
  },
  async mounted () {
    this.$emit('loading', true)
    try {
      let result = await this.$store.dispatch(
        'http/get',
        { url: 'assets?market=bitbank' },
        { root: true }
      )
      this.bb_data = result.data
      
      let vueinstance = this
      Object.keys(this.bb_data).forEach(async function (key) {
        if (['BTC', 'XRP', 'MONA', 'BCH'].includes(key)) {
          let jpyPrice = await vueinstance.getTicker('bitbank', key + '/JPY')
          vueinstance.total += vueinstance.bb_data[key] * jpyPrice
        } else if ('JPY' === key) {
          vueinstance.total += vueinstance.bb_data[key]
        } else {
          let btcPrice = await vueinstance.getTicker('bitbank', key + '/BTC')
          let btcJpyPrice = await vueinstance.getTicker('bitbank', 'BTC/JPY')
          vueinstance.total += vueinstance.bb_data[key] * btcPrice * btcJpyPrice
        }
      })
    } catch (err) {
      console.log(err)
      this.bb_error = true
    }
    try {
      let result = await this.$store.dispatch(
        'http/get',
        { url: 'assets?market=coincheck' },
        { root: true }
      )
      this.cc_data = result.data
      Object.keys(this.cc_data).forEach(async function (key) {
        if (['BTC'].includes(key)) {
          let jpyPrice = await vueinstance.getTicker('coincheck', key + '/JPY')
          vueinstance.total += vueinstance.cc_data[key] * jpyPrice
        } else if ('JPY' === key) {
          vueinstance.total += vueinstance.cc_data[key]
        }
      })
    } catch (err) {
      this.cc_error = true
    }
    this.$emit('loading', false)
  }
}
</script>
