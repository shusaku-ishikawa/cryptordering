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
    font-size: 14px
  }
  div.wrapper {
    background-color: #444444;
    box-shadow: 0 2px 5px rgba(0,0,0,0.26);
    margin: 10px 0px;
  }
  div.body {
    display: inline-block;
    /* margin: none;
    padding: none; */
  }
  span.prepend {
    display: inline-block;
    text-align: left;
    width: 25%;
    /* padding-right: 0 */
  }
  
  div.body {
    width: 70%;
    /* padding-left: 0 */
  }
  input {
    width: 100%;
    height: 30px;
    padding-right: 5px;
  }

</style>

<script>
export default {
  name: 'CustomTextInput',
  props: {
    value: { type: String },
    prepend_placeholder: { type: String, require: true },
    name: { type: String, require: true },
  }
}
</script>
