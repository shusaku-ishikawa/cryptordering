<template>
  <v-card>
    <table>
        <tr>
          <th>取引所</th>
          <td>{{ alert.market }}</td>
          <th>通貨</th>
          <td>{{ alert.symbol }}</td>
        </tr>
        <tr>
          <th>通知レート</th>
          <td colspan="3">{{ alert | withOverOrUnder }}</td>
        </tr>
        <tr>
          <th>コメント</th>
          <td colspan="3">{{ alert.comment }}</td>
        </tr>
        <tr>
          <th>
            <v-btn
              color="red accent-4"
              v-on:click="$emit('delete', alert.id)"
            >
              削除
            </v-btn>
          </th>
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
    width: 100%;
    border:solid gray 2px;
    font-size: 14px;
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
export default {
  name: 'AlertPageCard',
  data () {
    return {

    }
  },
  props: {
    'alert': { type: Object, require: true }
  },
  filters: {
    withOverOrUnder: function (obj) {
      console.log(obj)
      let quoteCurrency = obj.symbol.split('/')[1]
      if (obj.over_or_under === 'over') {
        return obj.rate + '' + quoteCurrency + 'を超えたら'
      } else {
        return obj.rate + '' + quoteCurrency + 'を下回ったら'
      }
    }
  }
}
</script>
