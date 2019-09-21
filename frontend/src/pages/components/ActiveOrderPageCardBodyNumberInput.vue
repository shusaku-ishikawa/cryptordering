<template>
  <div
    class="wrapper"
    v-bind:class="{ inactive: !active }"
  >
    <div class="body">
      <input type="number"
        :value="value"
        :readonly="!active"
        @input="updateValue"
        @focus="$emit('focus', $event)"
        @blur="$emit('blur', $event)"
      >
    </div>
     <span class="append">
      {{ currency }}
    </span>
  </div>
</template>
<style scoped>
  div.wrapper {
    background-color: #444444;
    box-shadow: 0 2px 5px rgba(0,0,0,0.26);
    margin: 10px 0px;
    text-align: right;
    font-size: 0
  }
  div.wrapper.updated {
    border: solid blue 2px;
  }
  div.wrapper.inactive {
    color: gray
  }
  div.body {
    display: inline-block;
    width: 75%
  }
  input {
    font-size: 12px;
    width: 100%;
    text-align: right;
  }
  span.append {
    display: inline-block;
    text-align: center;
    width: 25%;
    font-size: 12px;
  }
</style>
<script>
export default {
  name: 'ActiveOrderPageCardBodyNumberInput',
  data () {
    return {
      isUpdated: false
    }
  },
  props: {
    value: { type: Number, require: true },
    currency: { type: String, require: true },
    active: { type: Boolean, require: true }
  },
  methods: {
    updateValue (e) {
      this.isUpdated = true
      const newVal = Number(e.target.value)
      this.$emit('input', newVal)
      this.$emit('change', newVal)
    }
  }
}
</script>
