<template>
  <input
    type="text"
    :placeholder="placeholder"
    v-bind:value="value"
    v-on:input="$emit('input', $event.target.value)"
  />
</template>
<style scoped>
  * {
    color: white;
  }
  input {
    width: 100%;
    padding: 0 10px;
    text-align: left;
    background-color: #444444;
    height: 30px;
  }

</style>

<script>
export default {
  name: 'CustomTextInput',
  props: {
    value: { type: String },
    placeholder: { type: String }
  }
}
</script>
