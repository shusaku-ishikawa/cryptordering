<template>
  <v-card>
    <table>
      <tr>
        <th>取引所</th>
        <td colspan="3">{{ order.market }}</td>
      </tr>
      <tr>
        <th>注文ID</th>
        <td>{{ order.id }}</td>
        <th>通貨</th>
        <td>{{ order.symbol }}</td>
      </tr>
      <tr>
        <th>タイプ</th>
        <td>{{ order.type | toJapaneseType }}</td>
        <th>売/買</th>
        <td>{{ order.side | toJapaneseSide }}</td>
      </tr>
      <tr>
        <th>数量</th>
        <td>{{ order.amount | hyphenIfNull }}</td>
        <th>指値価格</th>
        <td>{{ order.price | hyphenIfNull }}</td>
      </tr>
      <tr>
        <th>約定数量</th>
        <td>{{ order.filled | hyphenIfNull }}</td>
        <th>平均価格</th>
        <td>{{ order.average | hyphenIfNull }}</td>
      </tr>
      <tr>
        <th>注文日時</th>
        <td>{{ order.timestamp | toReadableDate }}</td>
        <th>ステータス</th>
        <td>{{ order.status | toJapaneseStatus }}</td>
      </tr>
    </table>
  </v-card>
</template>
<style scoped>
  * {
    color: white;
  }
  div {
    margin-bottom: 10px;
  }
  table {
    border: solid gray 2px;
    width: 100%;
    font-size: 12px;
  }
  th, td {
    padding: 5px 10px;
  }
  th {
    text-align: left
  }
  td {
    text-align: right
  }
</style>
<script>
import moment from 'moment'
export default {
  name: 'OrderHistoryPageCard',
  data () {
    return {

    }
  },
  created () {
    console.log(this.order)
  },
  props: {
    'order': { type: Object, require: true }
  },
  filters: {
    toReadableDate: function (date) {
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
    },
    toJapaneseType: function (val) {
      if (val === 'market') {
        return '成行'
      } else if (val === 'limit') {
        return '指値'
      } else if (val === 'stop_market') {
        return '逆指値'
      } else if (val === 'stop_limit') {
        return 'ストップリミット'
      } else if (val === 'trail') {
        return 'トレール'
      }
    },
    toJapaneseSide: function (val) {
      if (val === 'sell') {
        return '売'
      } else if (val === 'buy') {
        return '買'
      }
    }
  }
}
</script>
