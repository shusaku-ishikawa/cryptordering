<template>
  <v-card>
    <table border="1">
        <tr>
          <td>取引所</td>
          <td>{{ market }}</td>
          <td>通貨</td>
          <td>{{ pair }}</td>
        </tr>
        <tr>
          <td>通知レート</td>
          <td colspan="3">{{ rate }}</td>
        </tr>
        <tr>
          <td>コメント</td>
          <td colspan="3">{{ comment }}</td>
        </tr>
    </table>
    <v-card-actions>
      <v-btn
        color="red accent-4"
        v-on:click="$emit('delete', id)"
      >
        削除
      </v-btn>
    </v-card-actions>
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
  props: {
    id: { type: Number, require: true },
    market: { type: String, require: true},
    pair: { type: String, require: true },
    rate: { type: Number, require: true },
    comment: { type: String, require: true }
  }
}
</script>