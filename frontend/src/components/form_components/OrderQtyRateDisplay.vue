<template>
  <div>
    <span v-show="!error">
      {{ rate }} %
    </span>
    <span v-show="error">
      数量不足
    </span>
  </div>
</template>
<style scoped>
  div {
    text-align: right
  }
</style>
<script>
export default {
  name: 'OrderQtyRateDisplay',
  props: {
    rate: { type: Number },
    error: { type: Boolean  }
  }
}
</script>
