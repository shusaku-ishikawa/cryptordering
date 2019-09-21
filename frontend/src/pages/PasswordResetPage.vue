<template>
  <div>
    <fieldset>
      <legend>トークン送付</legend>
      <CustomTextInput
        v-model="form.data.email"
        placeholder="登録メールアドレス"
      />
      <FormErrorMessage
        :errors="form.errors.email"
      />
      <div class="spacer"></div>
      <v-btn
        block
        color="teal"
        v-on:click="sendlink"
      >
        トークン送付
      </v-btn>
    </fieldset>
    <div class="spacer"></div>
    <fieldset>
      <legend>再設定</legend>
      <CustomPasswordInput
        v-model="form.data.new_password_1"
        placeholder="新しいパスワード"
      />
      <FormErrorMessage
      :errors="form.errors.new_password_1"
    />
      <div class="spacer"></div>
      <CustomPasswordInput
        v-model="form.data.new_password_2"
        placeholder="パスワード確認用"
      />
      <FormErrorMessage
        :errors="form.errors.new_password_2"
      />
      <div class="spacer"></div>
      <CustomTextInput
        v-model="form.data.token"
        placeholder="トークン"
      />
      <FormErrorMessage
        :errors="form.errors.token"
      />
      <div class="spacer"></div>
      <v-btn
        color="teal"
        block
        v-on:click="post"
      >
        登録
      </v-btn>
    </fieldset>
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
  ul li {
    color: red
  }
  fieldset {
    padding: 10px 20px
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
          new_password_1: '',
          new_password_2: ''
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
    sendlink: async function () {
      this.form.errors = {}
      let url_ = 'password-reset?email=' + this.form.data.email
      try {
        await this.$store.dispatch(
          'http/get',
          { url: url_ },
          { root: true }
        )
        this.flash('再設定用トークンを送付しました', 'success', {
          timeout: 1500
        })
      } catch (err) {
        const status = err.response.status
        if (status === 400) {
          this.form.errors = err.response.data
          console.log(this.form.errors)
        } else if (status === 404) {
          this.form.errors = {
            'email': ['登録されていないメールアドレスです']
          }
          console.log(err.response.data)
        }
      }
    },
    post: async function () {
      if (!this.checkPasswordConfirmation()) {
        return
      }
      this.form.errors = {}
      let url_ = 'password-reset/'
      try {
        await this.$store.dispatch(
          'http/post',
          { url: url_, data: this.form.data },
          { root: true }
        )
        this.flash('パスワードを変更しました', 'success', {
          timeout: 1500
        })
      } catch (err) {
        if (err.response.status === 400) {
          this.form.errors = err.response.data
        }
      }
    }
  }
}
</script>
