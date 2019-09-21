<template>
  <div
    class="wrapper"
  >
    <div
      class="processing"
      v-show="updating"
    >
    </div>
    <div>
      <table>
        <tr>
          <th>注文ID</th>
          <td colspan="3">{{ order.id }}</td>
        </tr>
        <tr>
          <th>注文日時</th>
          <td colspan="3">{{ order.timestamp | toReadableDate }}</td>
        </tr>
        <tr>
          <th>売買</th>
          <td>
            <ActiveOrderPageCardBodySelect
              :options="this.options.sides"
              v-model="form.data.side"
              :active="!updating"
            />
          </td>
          <th>タイプ</th>
          <td>
            <ActiveOrderPageCardBodySelect
              :options="this.options.orderTypes"
              v-model="form.data.type"
              :active="!updating"
            />
          </td>
        </tr>
        <tr>
          <th>指値金額</th>
          <td>
            <ActiveOrderPageCardBodyNumberInput
              v-model="form.data.price"
              :active="!updating && isLimitOrder"
              :currency="quoteCurrency"
            />
          </td>
          <th>逆指値価格</th>
          <td>
            <ActiveOrderPageCardBodyNumberInput
              v-model="form.data.stop_price"
              :active="!updating && isStopOrder"
              :currency="quoteCurrency"
            />
          </td>
        </tr>
        <tr>
          <th>トレール幅</th>
          <td>
            <ActiveOrderPageCardBodyNumberInput
              v-model="form.data.trail_width"
              :active="!updating && isTrailOrder"
              :currency="quoteCurrency"
            />
          </td>
        </tr>
        <tr>
          <th>数量</th>
          <td>
            <ActiveOrderPageCardBodyNumberInput
              v-model="form.data.amount"
              :active="!updating"
              :currency="baseCurrency"
            />
          </td>
          <th>約定数量</th>
          <td>{{ order.filled | hyphenIfNull }}</td>
        </tr>
        <tr>
          <th>平均価格</th>
          <td>{{ order.average | hyphenIfNull }}</td>
          <th>ステータス</th>
          <td>{{ order.status | toJapaneseStatus }}</td>
        </tr>
        <tr>
          <th colspan="3">
            <v-btn
              text
              color="red"
              :disabled="updating"
              v-on:click="cancelOrder"
            >
              CANCEL
            </v-btn>
            <v-btn
              text
              color="teal"
              :disabled="updating"
              v-on:click="updateOrder"
            >
              UPDATE
            </v-btn>
          </th>
          <td colspan="1">
            <OrderBadge
              :position="position"
            />
          </td>
        </tr>
      </table>  
    </div>
  </div>
</template>
<style scoped>
  * {
    color: white;
  }
  div.wrapper {
    position: relative
  }
  table {
    width: 100%;
    font-size: 12px;
    border-left: solid gray 3px;
    border-right: solid gray 3px;
    border-bottom: solid gray 3px;
  }
  th {
    text-align: left
  }
  td {
    text-align: right
  }
  td input {
    text-align: right
  }
  th, td {
    padding: 5px 5px;
  }
  select {
    width: 100%;
  }
  option {
    text-align: right
  }
  tr.errorMessage td {
    color: red
  }
  tr.successMessage td {
    color: teal
  }
  tr.successMessage td,
  tr.errorMessage td {
    text-align: center
  }
  button:disabled {
    color:gray
  }
  .overlay {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background-color: red;
    opacity: 0.3;
    z-index: 999

  }
</style>
<script>
import moment from 'moment'
import OrderBadge from './OrderBadge'
import ActiveOrderPageCardBodyNumberInput from './ActiveOrderPageCardBodyNumberInput'
import ActiveOrderPageCardBodySelect from './ActiveOrderPageCardBodySelect'
export default {
  name: 'ActiveOrderPageCardBody',
  data () {
    return {
      updating: false,
      operation: {
        isSuccess: false,
        message: ''
      },
      form: {
        data: null,
        errors: {}
      },
      options: {
        sides: [
          { text: '買', value: 'buy' },
          { text: '売', value: 'sell' }
        ],
        orderTypes: [
          {text: '成行', value: 'market'},
          {text: '指値', value: 'limit'},
          {text: '逆指値', value: 'stop_market'},
          {text: 'ストップリミット', value: 'stop_limit'},
          {text: 'トレール', value: 'trail'}
        ]
      }
    }
  },
  components: {
    OrderBadge,
    ActiveOrderPageCardBodyNumberInput,
    ActiveOrderPageCardBodySelect
  },
  props: {
    'order': { type: Object, require: true },
    'position': { type: String, require: true },
    'symbol': { type: String, require: true }
  },
  created: function () {
    this.form.data = this.order
  },
  watch: {
    'order': function (val) {
      this.form.data = val
    }
  },
  computed: {
    isLimitOrder: function () {
      return this.order.type.includes('limit')
    },
    isStopOrder: function () {
      return this.order.type.includes('stop')
    },
    isTrailOrder: function () {
      return this.order.type.includes('trail')
    },
    baseCurrency: function () {
      return this.symbol.split('/')[0]
    },
    quoteCurrency: function () {
      return this.symbol.split('/')[1]
    }
  },
  filters: {
    toReadableDate: function (date) {
      if (date === 0) {
        return '-'
      }
      return moment(date).format('YYYY/MM/DD HH:mm')
    },
    toJapaneseStatus: function (status) {
      if (status === 'open') {
        return '未約定'
      } else if (status === 'PARTIALLY_FILLED') {
        return '一部約定'
      } else if (status === 'closed') {
        return '約定済'
      } else if (status === 'CANCELED_UNFILLED') {
        return 'キャンセル済'
      } else if (status === 'CANCELED_PARTIALLY_FILLED') {
        return 'キャンセル済'
      } else if (status === 'READY_TO_ORDER') {
        return '注文準備完了'
      } else if (status === 'WAIT_OTHER_ORDER_TO_FILL') {
        return '他注文約定待'
      } else if (status === 'FAILED_TO_ORDER') {
        return '注文失敗'
      }
    },
    hyphenIfNull: function (val) {
      if (val === 0 || !val || isNaN(val)) {
        return '-'
      } else {
        return val
      }
    }
  },
  methods: {
    cancelOrder: async function () {
      this.operation.message = ''
      this.updating = true
      try {
        let url_ = 'orders/' + this.form.data.auto_id
        await this.$store.dispatch(
          'http/delete',
          { url: url_ },
          { root: true }
        )
        this.operation.isSuccess = true
        this.operation.message = 'キャンセルが成功しました'
      } catch (err) {
        const { status, data } = err.response
        let message
        if (status === 400) {
          message = 'この注文はキャンセルできません'
        } else if (status === 404) {
          message = 'この注文は存在しません'
        }
        this.operation = {
          isSuccess: false,
          message: message
        }
      }
      this.updating = false
      this.$emit('cancel', this.operation)
    },
    updateOrder: async function () {
      this.operation.message = ''
      this.updating = true
      try {
        let url_ = 'orders/' + this.form.data.auto_id + '/'
        await this.$store.dispatch(
          'http/patch',
          { url: url_, data: this.form.data },
          { root: true }
        )
        this.operation.isSuccess = true
        this.operation.message = '更新が成功しました'
      } catch (err) {
        const { status, data } = err.response
        let message = ''
        message += '更新に失敗しました\n'
        
        if (status === 400) {
          Object.keys(data).forEach(key => {
            message += key + ':' + data[key] + '\n'
          })

        } else if (status === 404) {
          message = 'この注文は存在しません'
        }
        this.operation = {
          isSuccess: false,
          message: message
        }
      }
      this.updating = false
      this.$emit('update', this.operation)
    }
  }
}
</script>
