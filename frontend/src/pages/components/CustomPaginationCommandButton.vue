<template>
  <button
    v-on:click="$emit('click', null)"
    :disabled="disabled"
  >
    {{ caption }}
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
  button:disabled {
      color: gray;
      background-color: #333333
  }
</style>
<script>
export default {
  props: {
    disabled: { type: Boolean },
    caption: { type: String, require: true }
  }
}
</script>
