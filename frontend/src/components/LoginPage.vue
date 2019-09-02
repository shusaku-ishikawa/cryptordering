<template>
<v-layout xs-10 column align-center>
    <v-form
      ref="form"
    >
      <v-text-field
        v-model="username"
        label="メールアドレス"
        required
      ></v-text-field>

      <v-text-field
        v-model="password"
        :type="'password'"
        label="パスワード"
        required
      ></v-text-field>

      <v-btn
        color="teal"
        class="mr-4"
        @click="login"
      >
        ログイン
      </v-btn>
       <v-btn
        color="red"
        class="mr-4"
      >
        新規登録
      </v-btn>
    </v-form>
  </v-layout>
</template>
<script>
export default {
  data () {
    return {
      username: '',
      password: ''
    }
  },
  methods: {
    async login () {
      try {
        await this.$store.dispatch(
          'auth/create',
          {
            username: this.username,
            password: this.password
          }
        )
        // login successfull
        this.$router.push('/info')
      } catch (err) {
        this.flash(err, 'error', {
          timeout: 1500
        })
      }
    }
  }
}
</script>
