<template>
  <v-card>
    <table>
      <tr>
        <td>取引所</td>
        <td colspan="3">{{ order.market }}</td>
      </tr>
      <tr>
        <td>注文ID</td>
        <td>{{ order.order_id }}</td>
        <td>通貨</td>
        <td>{{ order.pair }}</td>
      </tr>
      <tr>
        <td>タイプ</td>
        <td>{{ order.order_type }}</td>
        <td>売/買</td>
        <td>{{ order.side }}</td>
      </tr>
      <tr>
        <td>数量</td>
        <td>{{ order.start_amount }}</td>
        <td>指値価格</td>
        <td>{{ order.price }}</td>
      </tr>
      <tr>
        <td>約定数量</td>
        <td>{{ order.executed_amount }}</td>
        <td>平均価格</td>
        <td>{{ order.average_price }}</td>
      </tr>
      <tr>
        <td>注文日時</td>
        <td>{{ order.ordered_at }}</td>
        <td>ステータス</td>
        <td>{{ order.status }}</td>
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
    width: 100%
  }
  th, td {
    padding: 3px 3px;
  }
</style>
<script>
export default {
  name: 'AlertPageCard',
  data () {
    return {

    }
  },
  props: 'order'
}
</script>