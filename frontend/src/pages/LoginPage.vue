<template>
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
        block
        @click="login"
      >
        ログイン
      </v-btn>
    </v-form>
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
        this.$router.push('/order')
      } catch (err) {
        this.flash('ログインに失敗しました', 'error', {
          timeout: 3000
        })
      }
    }
  },
  mounted () {
    this.$store.dispatch(
      'auth/destroy'
    )
  }
}
</script>
