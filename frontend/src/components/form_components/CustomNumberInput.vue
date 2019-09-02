<template>
  <div class="wrapper">
    <span class="prepend">
      {{ prepend_placeholder }}
    </span>
    <div class="body">
      <input
        type="number"
        v-bind:value="value"
        v-on:input="$emit('input', $event.target.value)"
      />
    </div>
    <span class="append">
      {{ append_placeholder }}
    </span>
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
    text-align: right;
  }
  div.body {
    display: inline-block;
    /* margin: none;
    padding: none; */
  }
  span.prepend {
    display: inline-block;
    text-align: left;
    width: 26%;
    /* padding-right: 0 */
  }
  span.append {
    display: inline-block;
    text-align: left;
    width: 10%;
    /* padding-right: 0 */
  }
  
  div.body {
    width: 60%;
    /* padding-left: 0 */
  }
  input {
    width: 100%;
    height: 30px;
    padding-right: 5px;
    text-align: right
  }

</style>

<script>
export default {
  name: 'CustomNumberInput',
  props: {
    init_value: {  type: Number, default: 0 },
    value: { type: Number },
    prepend_placeholder: { type: String, require: true },
    append_placeholder: { type: String, require: true },
    name: { type: String, require: true },
  }
}
</script>
