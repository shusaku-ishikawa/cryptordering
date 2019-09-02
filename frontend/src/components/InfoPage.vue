<template>
   <v-container>
     <v-row>
      <v-col
        xs="12"
        md="6"
        offset-md="3"
      >
        <v-form
          ref="form"
        >
           <v-text-field
            v-model="form.full_name"
            label="名前"
            required
          ></v-text-field>

          <v-text-field
            v-model="form.bb_api_key"
            label="Bitbank APIキー"
            required
          ></v-text-field>

          <v-text-field
            v-model="form.bb_api_secret_key"
            label="Bitbank API Secretキー"
            required
          ></v-text-field>

          <v-text-field
            v-model="form.cc_api_key"
            label="Coincheck APIキー"
            required
          ></v-text-field>

          <v-text-field
            v-model="form.cc_api_secret_key"
            label="Coincheck API Secretキー"
            required
          ></v-text-field>

          <v-text-field
            v-model="form.email_for_notice"
            label="通知用メールアドレス"
            required
          ></v-text-field>


          <div class="toggle">
            <span class="my-label">アラート</span>
            <toggle-button
              v-model="form.use_alert"
              :sync="true"
              :height="30"
              :width="100"
              :labels="{checked: '通知する', unchecked: '通知しない'}"
            ></toggle-button>
          </div>
          <div class="toggle">
            <span class="my-label">約定通知</span>
            <toggle-button
              v-model="form.notify_if_filled"
              :sync="true"
              :height="30"
              :width="100"
              :labels="{checked: '通知する', unchecked: '通知しない'}"
            ></toggle-button>
          </div>
          <v-btn
            color="success"
            class="mr-4"
            @click="save"
          >
            更新
          </v-btn>
        </v-form>
      </v-col>
     </v-row>
   </v-container>
</template>
<style scoped>
  span.my-label  {
    color: white;
    font-size: 12px;
    text-align: left;
  }
  div.toggle {
    margin: 5px 0px;
  }
  button.mr-4 {
    margin-top: 15px
  }
</style>
<script>

export default {
  name: 'info',
  data () {
    return {
      form: {
        full_name: '',
        bb_api_key: '',
        bb_api_secret_key: '',
        cc_api_key: '',
        cc_api_secret_key: '',
        use_alert: false,
        notify_if_filled: false
      }
    }
  },
  async created () {
    try {
      let result = await this.$store.dispatch(
        'http/get',
        { url: this.$store.getters['auth/userInfoGetUrl'] },
        { root: true }
      )
      this.form = result.data
      console.log(result.data)
   } catch (err) {
      throw err
    }
  },
  methods: {
    async save () {
      console.log(this.form)
      try {
        await this.$store.dispatch(
          'http/patch',
          { url: this.$store.getters['auth/userInfoPostUrl'], data: this.form },
          { root: true }
        )
        this.flash('登録情報を更新しました', 'success', {
          timeout: 1500
        })
      } catch (err) {
        console.log(err.response.data)
        this.flash('登録情報の更新に失敗しました', 'error', {
          timeout: 1500
        })
      }
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
