<template>
  <div>
    <div v-show="loading" class="loader">Now loading...</div>
    <v-data-table
      v-show="!loading"
      :headers="headers"
      :items="symbols"
      :items-per-page="5"
    >
      <template v-slot:item.showprofit="{ item }">
        <v-btn
          @click="showProfit(item)"
          color="success"
        >
          表示
        </v-btn>
      </template>
    </v-data-table>
  </div>
</template>
<style>
  @import '../assets/css/loading.css';
</style>
<script>
export default {
  data () {
    return {
      headers: [
        { text: '#1 symbol', value: 't1_symbol' },
        { text: '#1 side', value: 't1_side' },
        { text: '#2 symbol', value: 't2_symbol' },
        { text: '#2 side', value: 't2_side' },
        { text: '#3 symbol', value: 't3_symbol' },
        { text: '#3 side', value: 't3_side' },
        { text: '利益', value: 'showprofit'}
      ],
      symbols: [],
      loading: true
    }
  },
  async created () {
    try {
      let result = await this.$store.dispatch(
        'http/get',
        { url: this.$store.getters['auth/orderSequenceUrl'] },
        { root: true }
      )
      this.symbols = result.data
    } catch (err) {
      this.flash(err, 'error', {
        timeout: 1500
      })
    }
    this.loading = false;
  },
  methods: {
    async showProfit(item) {
      this.laoding = true;
      let url = 'profit?id=' + item.id;
      try {
        let result = await this.$store.dispatch(
          'http/get',
          { url: url },
          { root: true }
        )
        if (result.data) {
          alert('利益は' + result.data.profit + this.$store.getters['auth/currency'] + 'です');
        }
      } catch (err) {
        this.flash(err, 'error', {
          timeout: 1500
        })
      }
      this.loading = false;
    }
  }
}
</script>
