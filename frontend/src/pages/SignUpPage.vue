<template>
  <div>
    <CustomTextInput
      v-model="form.data.email"
      placeholder="登録メールアドレス"
    />
    <FormErrorMessage
      :errors="form.errors.email"
    />
    <div class="spacer"></div>
    <CustomTextInput
      v-model="form.data.full_name"
      placeholder="名前(本名)"
    />
    <FormErrorMessage
      :errors="form.errors.full_name"
    />
    <div class="spacer"></div>
    <CustomTextInput
      v-model="form.data.bb_api_key"
      placeholder="bitbank API Key"
    />
    <FormErrorMessage
      :errors="form.errors.bb_api_key"
    />
    <div class="spacer"></div>
    <CustomTextInput
      v-model="form.data.bb_api_secret_key"
      placeholder="bitbank Secret Key"
    />
    <FormErrorMessage
      :errors="form.errors.bb_api_secret_key"
    />
    <div class="spacer"></div>
    <CustomTextInput
      v-model="form.data.cc_api_key"
      placeholder="coincheck API Key"
    />
    <FormErrorMessage
      :errors="form.errors.cc_api_key"
    />
    <div class="spacer"></div>
    <CustomTextInput
      v-model="form.data.cc_api_secret_key"
      placeholder="coincheck Secret Key"
    />
    <FormErrorMessage
      :errors="form.errors.cc_api_secret_key"
    />
    <div class="spacer"></div>
    <CustomTextInput
      v-model="form.data.email_for_notice"
      placeholder="通知用メールアドレス"
    />
    <FormErrorMessage
      :errors="form.errors.email_for_notice"
    />
    <div class="spacer"></div>
    <span>
      約定通知
    </span>
    <CustomToggleSwitch
      :caption="{ on: 'ON', off: 'OFF' }"
      v-model="form.data.notify_if_filled"
    />
    <div class="spacer"></div>
    <span>
      アラートメール通知
    </span>
    <CustomToggleSwitch
      :caption="{ on: 'ON', off: 'OFF' }"
      v-model="form.data.use_alert"
    />
    <div class="spacer"></div>
    <CustomPasswordInput
      v-model="form.data.password"
      placeholder="パスワード"
    />
    <FormErrorMessage
      :errors="form.errors.password"
    />
    <div class="spacer"></div>
    <CustomPasswordInput
      v-model="form.data.password2"
      placeholder="パスワード確認用"
    />
    <div class="spacer"></div>
    <v-btn
      color="teal"
      block
      v-on:click="signup"
    >
      登録
    </v-btn>
  </div>
</template>
<style scoped>
  * {
    color:white
  }
  div {
    text-align: left
  }
  div.spacer {
    height : 20px;
  }
</style>
<script>
import CustomTextInput from './components/CustomTextInput'
import CustomPasswordInput from './components/CustomPasswordInput'
import CustomToggleSwitch from './components/CustomToggleSwitch'
import FormErrorMessage from './components/FormErrorMessage'

export default {
  components: {
    CustomTextInput,
    CustomPasswordInput,
    CustomToggleSwitch,
    FormErrorMessage
  },
  data () {
    return {
      form: {
        data: {
          email: '',
          full_name: '',
          bb_api_key: '',
          bb_api_secret_key: '',
          cc_api_key: '',
          cc_api_secret_key: '',
          email_for_notice: '',
          notify_if_filled: false,
          use_alert: false,
          password: '',
          password2: ''
        },
        errors: {}
      }
    }
  },
  async created () {
  },
  methods: {
    checkPasswordConfirmation: function () {
      if (this.form.data.password !== this.form.data.password2) {
        this.form.errors = {
          'password': ['確認用パスワードと一致しません']
        }
        return false
      } else {
        return true
      }
    },
    signup: async function () {
      if (!this.checkPasswordConfirmation()) {
        return
      }
      this.form.errors = {}
      let url_ = 'signup/'
      try {
        await this.$store.dispatch(
          'http/post',
          { url: url_, data: this.form.data },
          { root: true }
        )
        this.flash('本登録用リンクを送付しました', 'success', {
          timeout: 1500
        })
      } catch (err) {
        if (err.response.status === 400) {
          this.form.errors = err.response.data
          console.log(this.form.errors)
        }
        this.flash(err, 'error', {
          timeout: 1500
        })
      }
    }
  }
}
</script>
