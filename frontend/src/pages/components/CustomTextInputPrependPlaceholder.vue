<template>
  <div class="wrapper">
    <span class="prepend">
      {{ prepend_placeholder }}
    </span>
    <div class="body">
      <input
        type="text"
        v-bind:value="value"
        v-on:input="$emit('input', $event.target.value)"
      />
    </div>
  </div>
</template>
<style scoped>
  * {
    color: white;
  }
  div.wrapper {
    background-color: #444444;
    box-shadow: 0 2px 5px rgba(0,0,0,0.26);
    margin: 10px 0px;
    font-size: 0
  }
  div.body {
    display: inline-block;
  }
  span.prepend {
    display: inline-block;
    text-align: left;
    width: 30%;
    font-size: 12px;
    padding-left: 5px;
  }

  div.body {
    width: 70%;
    /* padding-left: 0 */
  }
  input {
    width: 100%;
    padding-right: 5px;
    font-size: 12px;
    height: 30px;
  }

</style>

<script>
export default {
  name: 'CustomTextInputPrependPlaceholder',
  props: {
    value: { type: String },
    prepend_placeholder: { type: String, require: true },
    name: { type: String, require: true }
  }
}
</script>
