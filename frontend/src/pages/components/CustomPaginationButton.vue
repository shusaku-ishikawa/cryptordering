<template>
  <button
    v-on:click="$emit('click', value)"
    v-bind:class="{ active: isActive }"
  >
    {{ value }}
  </button>
</template>
<style scoped>
  button {
    width: 30px;
    margin: 3px;
    color: white;
    border-radius: 20%;
    background-color: #222222;

  }
  button.active {
    background-color: gray;
  }
</style>
<script>
export default {
  props: {
    isActive: { type: Boolean, require: true },
    disabled: { type: Boolean },
    value: { type: Number, require: true }
  }
}
</script>
