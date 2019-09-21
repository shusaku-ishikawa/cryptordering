<template>
  <v-app id="app">
    <v-container>
      <v-row>
        <v-col
          xs="12"
          md="6"
          offset-md="3"
        >
          <PrivateNavbar
            v-show="this.$store.getters['auth/isAuthenticated']"
            :routes="privateRoutes"
            v-model="activeRoute"
          />
          <PublicNavbar
            v-show="!this.$store.getters['auth/isAuthenticated']"
            :routes="publicRoutes"
            v-model="activeRoute"
          />
          <div v-show="loading" class="loader">Now loading...</div>
          <flash-message class="myCustomClass"></flash-message>
          <router-view
            v-show="!loading"
            v-on:loading="setLoading"
          />
        </v-col>
      </v-row>
    </v-container>
  </v-app>
</template>
<script>
import PrivateNavbar from '@/pages/PrivateNavbar'
import PublicNavbar from '@/pages/PublicNavbar'
export default {
  name: 'App',
  components: { PrivateNavbar, PublicNavbar },
  data () {
    return {
      loading: false,
      activeRoute: ''
    }
  },
  computed: {
    publicRoutes: function () {
      return this.$router.options.routes.filter(route => route.meta.isPublic)
    },
    privateRoutes: function () {
      return this.$router.options.routes.filter(route => !route.meta.isPublic)
    }
  },
  watch: {
    $route: function (to, from) {
      this.activeRoute = to.name
    }
  },
  methods: {
    setLoading (val) {
      this.loading = val
    },
    setProcessing (val) {
      this.processing = val
    }
  }
}
</script>
<style>
@import './assets/css/loading.css';
@import './assets/css/processing.css';
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
