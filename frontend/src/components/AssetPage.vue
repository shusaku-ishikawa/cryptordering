<template>
  <v-container>
    <div v-show="loading" class="loader">Now loading...</div>
    <v-row>
      <v-col
        md="6"
        offset-md="3"
        xs="12"
        v-show="!loading"
      >
        <fieldset>
          <legend>
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
                <tr v-for="(asset, index) in bb_data" :key="index">
                  <td align="center">{{ asset.asset }}</td>
                  <td align="center">{{ asset.onhand_amount }}</td>
                </tr>
              </tbody>
            </table>
        </fieldset>
        <fieldset>
          <legend>
            coincheck
          </legend>
              <span
              v-show="cc_error"
            >
              取得に失敗しました
            </span>
            <table
            v-show="!cc_show"
            >
              <thead>
                <tr>
                  <th v-for="(header, index) in headers" :key="index">{{ header.text }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(asset, index) in cc_data" :key="index">
                  <td align="center">{{ asset.asset }}</td>
                  <td align="center">{{ asset.onhand_amount }}</td>
                </tr>
              </tbody>
            </table>
        </fieldset>
      </v-col>
    </v-row>
  </v-container>
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
      loading: true,
      headers: [
        { text: '通貨', value: 'asset' },
        { text: '残高', value: 'free' },
      ],
      bb_data: [],
      bb_error: false,
      cc_data: [],
      cc_error: false
    }
  },
  async created () {
    this.loading = true
    // bb
    try {
      let result = await this.$store.dispatch(
        'http/get',
        { url: 'assets?market=bitbank' },
        { root: true }
      )
      this.bb_data = result.data.assets
    } catch (err) {
      this.bb_error = true
      this.flash(err, 'error', {
        timeout: 1500
      })
    }
    //cc 
    try {
      let result = await this.$store.dispatch(
        'http/get',
        { url: 'assets?market=coincheck' },
        { root: true }
      )
      console.log(result.data)
      this.cc_data = result.data.assets
    } catch (err) {
      this.cc_error = true
      this.flash(err, 'error', {
        timeout: 1500
      })
    }
    this.loading = false
  }
}
</script>
