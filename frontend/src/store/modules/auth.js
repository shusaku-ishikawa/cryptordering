export default {
  namespaced: true,
  state: {
    userid: '',
    username: '',
    token: ''
  },
  mutations: {
    create (state, data) {
      state.userid = data.userid
      state.token = data.token
      state.username = data.username
    },
    destroy (state) {
      state.userid = ''
      state.username = ''
      state.token = ''
    }
  },
  getters: {
    isAuthenticated: (state, getters) => {
      return state.token !== ''
    },
    userInfoGetUrl: (state, getters) => {
      return 'users/' + state.userid
    },
    userInfoPostUrl: (state, getters) => {
      return getters.userInfoGetUrl + '/'
    }
  },
  actions: {
    async create ({ commit, dispatch }, data) {
      try {
        let result = await dispatch(
          'http/post',
          { url: 'get-token/', data: data },
          { root: true }
        )
        if (result.data.token) {
          console.log(result.data)
          commit('create', {
            userid: result.data.id,
            username: data.username,
            token: result.data.token
          })
        }
      } catch (err) {
        throw err
      }
    },
    destroy ({ commit, dispatch }, data) {
      commit('destroy')
    }
  }
}
