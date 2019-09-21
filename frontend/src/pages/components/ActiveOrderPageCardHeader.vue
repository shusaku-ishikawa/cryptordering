<template>
  <table>
    <tr>
      <th>特殊注文ID</th>
      <td colspan="3">{{ id }}</td>
    </tr>
    <tr>
      <th>特殊注文日時</th>
      <td colspan="3">{{ placedAt | toReadableDate }}</td>
    </tr>
    <tr>
      <th>取引所</th>
      <td>{{ market }}</td>
      <th>取引通貨</th>
      <td>{{ symbol }}</td>
    </tr>
    <tr>
      <th>特殊注文</th>
      <td colspan="3">{{ specialOrder }}</td>
    </tr>
  </table>
</template>
<style scoped>
  * {
    color: white;
  }
  div {
    margin-bottom: 10px;
  }
  table {
    width: 100%;
    font-size: 12px;
    border: solid gray 3px;
  }
  th {
    text-align: left
  }
  td {
    text-align: right
  }
  th, td {
    padding: 5px 5px;
  }

</style>
<script>
import moment from 'moment'
export default {
  name: 'ActiveOrderPageCardHeader',
  data () {
    return {

    }
  },
  props: {
    id: { type: Number, require: true },
    placedAt: { type: String, require: true },
    market: { type: String, require: true },
    symbol: { type: String, require: true },
    specialOrder: { type: String, require: true }
  },
  filters: {
    toReadableDate: function (date) {
      if (date === 0) {
        return '-'
      }
      return moment(date).format('YYYY/MM/DD HH:mm')
    }
  }
}
</script>
