<template>
  <div>
    <fieldset>
      <legend align="left">登録情報</legend>
        <table>
          <tr>
            <th>
              登録日
            </th>
            <td>
              {{ form.date_joined | formatDate }}
            </td>
          </tr>
          <tr>
            <th>
              名前
            </th>
            <td>
              <CustomTextInput
                v-model="form.data.full_name"
              />
              <FormErrorMessage
                :errors="form.errors.full_name"
              />
            </td>
          </tr>
          <tr>
            <th>
              登録メールアドレス
            </th>
            <td>
              {{ form.data.email }}
            </td>
          </tr>
          <tr>
            <th>
              bitbank API Key
            </th>
            <td>
              <CustomTextInput
                v-model="form.data.bb_api_key"
              />
              <FormErrorMessage
                :errors="form.errors.bb_api_key"
              />
            </td>
          </tr>
          <tr>
            <th>
              bitbank Secret Key
            </th>
            <td>
              <CustomTextInput
                v-model="form.data.bb_api_secret_key"
              />
              <FormErrorMessage
                :errors="form.errors.bb_api_secret_key"
              />
            </td>
          </tr>
          <tr>
            <th>
              coincheck API Key
            </th>
            <td>
              <CustomTextInput
                v-model="form.data.cc_api_key"
              />
              <FormErrorMessage
                :errors="form.errors.cc_api_key"
              />
            </td>
          </tr>
          <tr>
            <th>
              coincheck Secret Key
            </th>
            <td>
              <CustomTextInput
                v-model="form.data.cc_api_secret_key"
              />
              <FormErrorMessage
                :errors="form.errors.cc_api_secret_key"
              />
            </td>
          </tr>
            <tr>
            <th>
              通知用メールアドレス
            </th>
            <td>
              <CustomTextInput
                v-model="form.data.email_for_notice"
              />
              <FormErrorMessage
                :errors="form.errors.email_for_notice"
              />
            </td>
          </tr>
        </table>
        <v-btn
          color="teal"
          v-on:click="save"
        >
          更新
        </v-btn>
        <v-btn
          color="red"
          v-on:click="logout"
        >
          ログアウト
        </v-btn>
    </fieldset>
    <fieldset>
      <legend align="left">パスワード</legend>
      <table>
        <tr>
          <th>現在のパスワード</th>
          <td>
            <CustomPasswordInput
              v-model="passwordForm.data.old_password"
            />
            <FormErrorMessage
              :errors="passwordForm.errors.old_password"
            />
          </td>
        </tr>
        <tr>
          <th>新しいパスワード</th>
          <td>
            <CustomPasswordInput
              v-model="passwordForm.data.new_password_1"
            />
            <FormErrorMessage
              :errors="passwordForm.errors.new_password_1"
            />
          </td>
        </tr>
        <tr>
          <th>新しいパスワード2</th>
          <td>
            <CustomPasswordInput
              v-model="passwordForm.data.new_password_2"
            />
            <FormErrorMessage
              :errors="passwordForm.errors.new_password_2"
            />
          </td>
        </tr>
      </table>
      <v-btn
        color="teal"
        block
        v-on:click="changePassword"
      >
        更新
      </v-btn>
    </fieldset>
  </div>
</template>
<style scoped>
  * {
    color: white
  }
  fieldset {
    padding:10px
  }
  table {
    color: white;
    width: 100%;
    border: none;
    border-collapse:collapse;
    table-layout: fixed;
    margin-bottom: 10px;
  }
  tr {
    border-bottom: groove darkgray 1px;
  }
  th {
    text-align: left;
    width: 40%;
  }
  td {
    width: 60%;
    text-align: left;
    padding: 3px;
  }
  button {
    width: 45%
  }
</style>
<script>
import CustomTextInput from './components/CustomTextInput'
import CustomPasswordInput from './components/CustomPasswordInput'
import FormErrorMessage from './components/FormErrorMessage'
import moment from 'moment'
export default {
  name: 'info',
  components: {
    CustomTextInput,
    CustomPasswordInput,
    FormErrorMessage
  },
  data () {
    return {
      form: {
        data: {
          email: '',
          date_joined: '',
          full_name: '',
          email_for_notice: '',
          bb_api_key: '',
          bb_api_secret_key: '',
          cc_api_key: '',
          cc_api_secret_key: ''
        },
        errors: {}
      },
      passwordForm: {
        data: {
          old_password: '',
          new_password_1: '',
          new_password_2: ''
        },
        errors: {}
      }
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
    },
    async logout () {
      try {
        await this.$store.dispatch(
          'auth/destroy'
        )
        this.$router.push('login')
      } catch (err) {
      }
    },
    async changePassword () {
      try {
        await this.$store.dispatch(
          'http/post',
          { url: 'password-change/', data: this.passwordForm.data },
          { root: true }
        )
        this.flash('パスワードを更新しました', 'success', {
          timeout: 1500
        })
        this.passwordForm.data.old_password = ''
        this.passwordForm.data.new_password_1 = ''
        this.passwordForm.data.new_password_2 = ''
      } catch (err) {
        const status = err.response.status
        if (status === 400) {
          this.passwordForm.errors = err.response.data
        }
      }
    }
  },
  async created () {
    this.$emit('loading', true)
    try {
      let result = await this.$store.dispatch(
        'http/get',
        { url: this.$store.getters['auth/userInfoGetUrl'] },
        { root: true }
      )
      this.form.data = result.data
    } catch (err) {
      throw err
    }
    this.$emit('loading', false)
  },
  filters: {
    formatDate: function (val) {
      return moment(val).format('YYYY/MM/DD HH:mm')
    }
  }
}
</script>
