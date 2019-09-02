import axios from 'axios'

export default {
  namespaced: true,
  actions: {
    async request ({ dispatch, rootState }, { method, url, data, error }) {
      const headers = {}
      headers['Content-Type'] = 'application/json'
      if (rootState.auth.token) {
        headers['Authorization'] = `Token ${rootState.auth.token}`
      }
      const options = {
        method,
        url: `${process.env.API_ROOT}${url}`,
        headers,
        data,
        timeout: 15000
      }
      try {
        console.log(options)
        return await axios(options)
      } catch (err) {
        // http error
        throw err
      }
    },
    async post ({ dispatch }, requests) {
      requests.method = 'post'
      return dispatch('request', requests)
    },
    async delete ({ dispatch }, requests) {
      requests.method = 'delete'
      return dispatch('request', requests)
    },
    async patch ({ dispatch }, requests) {
      requests.method = 'patch'
      return dispatch('request', requests)
    },
    async get ({ dispatch }, requests) {
      requests.method = 'get'
      return dispatch('request', requests)
    }
  }
}
