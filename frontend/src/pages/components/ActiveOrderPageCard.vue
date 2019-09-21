<template>
  <v-card>
    <ActiveOrderPageCardHeader
      :id="relation.id"
      :market="relation.market"
      :symbol="relation.symbol"
      :placedAt="relation.placed_at"
      :specialOrder="relation.special_order"
    />
    <ActiveOrderPageCardBody
      v-if="relation.order_1"
      :order="relation.order_1"
      :symbol="relation.symbol"
      position="order1"
      v-on:cancel="$emit('operation', $event)"
      v-on:update="$emit('operation', $event)"
    />
    <ActiveOrderPageCardBody
      v-if="relation.order_2"
      :order="relation.order_2"
      :symbol="relation.symbol"
      position="order2"
      v-on:cancel="$emit('operation', $event)"
      v-on:update="$emit('operation', $event)"
    />
    <ActiveOrderPageCardBody
      v-if="relation.order_3"
      :order="relation.order_3"
      :symbol="relation.symbol"
      position="order3"
      v-on:cancel="$emit('operation', $event)"
      v-on:update="$emit('operation', $event)"
    />
  </v-card>
</template>
<style scoped>
  * {
    color: white;
  }
  div.v-card {
    margin-bottom: 10px;
  }
</style>
<script>
import ActiveOrderPageCardHeader from './ActiveOrderPageCardHeader'
import ActiveOrderPageCardBody from './ActiveOrderPageCardBody'

export default {
  name: 'ActiveOrderPageCard',
  components: {
    ActiveOrderPageCardHeader,
    ActiveOrderPageCardBody
  },
  props: {
    relation: { type: Object, require: true }
  }
}
</script>
