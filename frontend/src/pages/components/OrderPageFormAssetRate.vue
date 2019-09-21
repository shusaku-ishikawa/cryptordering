<template>
  <div>
    <span
      v-bind:class="{ inactive: !active }"
    >
      {{ message }}
    </span>
  </div>
</template>
<style scoped>
  div {
    text-align: right
  }
  span.inactive {
    color:gray
  }
</style>
<script>
export default {
  name: 'OrderPageFormAssetRate',
  props: {
    rate: { type: Number },
    active: { type: Boolean, default: true }
  },
  computed: {
    'message': function () {
      if (isNaN(this.rate) || this.rate > 100) {
        return '数量不足'
      } else {
        return this.rate + '%'
      }
    }
  }
}
</script>
