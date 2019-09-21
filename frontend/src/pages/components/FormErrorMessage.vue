<template>
  <ul
    v-if="errors"
  >
    <li
      v-for="(error, index) in errors"
      v-bind:key="index"
    >
      {{ error }}
    </li>
  </ul>
</template>
<style scoped>
  ul li {
    color: red
  }
</style>
<script>
export default {
  props: {
    errors: { type: Array, require: false, default: null }
  }
}
</script>
