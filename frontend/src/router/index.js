import Vue from 'vue'
import Router from 'vue-router'

// components
// import HelloWorld from '@/components/HelloWorld'
import Login from '@/components/LoginPage'
import Info from '@/components/InfoPage'
import Order from '@/components/OrderPage'
import Asset from '@/components/AssetPage'
import Alert from '@/components/AlertPage'
import Store from '../store/index.js'

Vue.use(Router)

const router = new Router({
  routes: [
    {
      path: '/login',
      name: 'login',
      component: Login,
      meta: {
        isPublic: true
      }
    },
    {
      path: '/info',
      name: 'info',
      component: Info,
      meta: {
        isPublic: false
      }
    },
    {
      path: '/asset',
      name: 'asset',
      component: Asset,
      meta: {
        isPublic: false
      }
    },
    {
      path: '/order',
      name: 'order',
      component: Order,
      meta: {
        isPublic: false
      }
    },
    {
      path: '/alert',
      name: 'alert',
      component: Alert,
      meta: {
        isPublic: false
      }
    }
  ]
})
router.beforeEach((to, from, next) => {
  if (to.matched.some(page => page.meta.isPublic) || Store.state.auth.token) {
    next()
  } else {
    next('/login')
  }
})

export default router
