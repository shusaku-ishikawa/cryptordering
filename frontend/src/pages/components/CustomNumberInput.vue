<template>
  <div
    class="wrapper"
    v-bind:class="{ inactive: !active }"
  >
    <span class="prepend">
      {{ prepend_placeholder }}
    </span>
    <div class="body">
      <input
        :readonly="!active"
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
    font-size: 0
  }
  
  div.body {
    display: inline-block;
  }
  span.prepend {
    display: inline-block;
    text-align: left;
    padding-left: 5px;
    width: 30%;
    font-size: 12px;
  }
  span.append {
    display: inline-block;
    text-align: center;
    width: 10%;
    font-size: 12px;
  }
  div.body {
    width: 60%;
    /* padding-left: 0 */
  }
  input {
    width: 100%;
    height: 30px;
    padding-right: 5px;
    text-align: right;
    font-size: 12px;
  }
  div.wrapper.inactive input,
  div.wrapper.inactive span {
    color:gray
  }

</style>

<script>
export default {
  name: 'CustomNumberInput',
  props: {
    value: { type: Number },
    prepend_placeholder: { type: String, require: true },
    append_placeholder: { type: String, require: true },
    name: { type: String, require: true },
    active: { type: Boolean, default: true }
  }
}
</script>
