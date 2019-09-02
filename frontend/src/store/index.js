import Vue from 'vue'
import Vuex from 'vuex'

import createPersistedState from 'vuex-persistedstate'

import auth from '@/store/modules/auth'
import http from '@/store/modules/http'
// import message from '@/store/modules/message'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    auth,
    http
  },
  plugins: [createPersistedState({
    key: 'example',
    storage: window.sessionStorage
  })]
})
