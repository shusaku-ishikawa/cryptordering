import Vue from 'vue'
import Router from 'vue-router'

// components
// import HelloWorld from '@/components/HelloWorld'
import Login from '@/pages/LoginPage'
import Info from '@/pages/InfoPage'
import Order from '@/pages/OrderPage'
import ActiveOrderPage from '@/pages/ActiveOrderPage'
import OrderHistory from '@/pages/OrderHistoryPage'
import Asset from '@/pages/AssetPage'
import Alert from '@/pages/AlertPage'
import Contact from '@/pages/ContactPage'
import SignUp from '@/pages/SignUpPage'
import PasswordReset from '@/pages/PasswordResetPage'
import Store from '../store/index.js'

Vue.use(Router)

const router = new Router({
  routes: [
    {
      path: '/login',
      name: 'login',
      component: Login,
      meta: {
        caption: 'ログイン',
        isPublic: true
      }
    },
    {
      path: '/signup',
      name: 'signup',
      component: SignUp,
      meta: {
        caption: '会員登録',
        isPublic: true
      }
    },
    {
      path: '/passwordreset',
      name: 'passwordreset',
      component: PasswordReset,
      meta: {
        caption: 'パスワードリセット',
        isPublic: true
      }
    },

    {
      path: '/order',
      name: 'order',
      component: Order,
      meta: {
        caption: '注文する',
        isPublic: false
      }
    },
    {
      path: '/active',
      name: 'active',
      component: ActiveOrderPage,
      meta: {
        caption: '発注一覧',
        isPublic: false
      }
    },
    {
      path: '/history',
      name: 'history',
      component: OrderHistory,
      meta: {
        caption: '注文履歴',
        isPublic: false
      }
    },
    {
      path: '/alert',
      name: 'alert',
      component: Alert,
      meta: {
        caption: '通知設定',
        isPublic: false
      }
    },
    {
      path: '/asset',
      name: 'asset',
      component: Asset,
      meta: {
        caption: '保有資産',
        isPublic: false
      }
    },
    {
      path: '/info',
      name: 'info',
      component: Info,
      meta: {
        caption: '登録情報',
        isPublic: false
      }
    },
    {
      path: '/contact',
      name: 'contact',
      component: Contact,
      meta: {
        caption: '問い合せ',
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
