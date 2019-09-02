// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import store from './store'
import Vuetify from 'vuetify'
import VueFlashMessage from 'vue-flash-message'
import ToggleButton from 'vue-js-toggle-button'
// Vue.use(BootstrapVue)
Vue.config.productionTip = false
require('vue-flash-message/dist/vue-flash-message.min.css')
Vue.use(VueFlashMessage)
Vue.use(Vuetify)
Vue.use(ToggleButton)

const opts = {
  theme: {
    dark: true
  }
}

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  vuetify: new Vuetify(opts),
  components: { App },
  template: '<App/>'
})
