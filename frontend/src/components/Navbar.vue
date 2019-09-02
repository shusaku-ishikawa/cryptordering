<template>
  <v-bottom-navigation
    v-model="bottomNav"
  >
    <v-btn>
      <router-link :to="{name: 'order'}" tag="button">
        <span>注文する</span>
      </router-link>
    </v-btn>
    <v-btn value="active_orders">
      <router-link :to="{name: 'active_orders'}" tag="button">
        <span>発注一覧</span>
      </router-link>
    </v-btn>
    <v-btn value="order_history">
      <router-link :to="{name: 'order_history'}" tag="button">
        <span>取引履歴</span>
      </router-link>
    </v-btn>
    <v-btn value="alert">
      <router-link :to="{name: 'alert'}" tag="button">
        <span>通知設定</span>
      </router-link>
    </v-btn>
    <v-btn value="asset">
      <router-link :to="{name: 'asset'}" tag="button">
        <span>保有資産</span>
      </router-link>
    </v-btn>
    <v-btn value="info">
      <router-link :to="{name: 'info'}" tag="button">
        <span>個人情報</span>
      </router-link>
    </v-btn>
    <v-btn value="contact">
      <router-link :to="{name: 'contact'}" tag="button">
        <span>問い合せ</span>
      </router-link>
    </v-btn>
  </v-bottom-navigation>
</template>
<script>
export default {
  data () {
    return {
      bottomNav: 'order'
    }
  }
}
</script>
