<template>
  <select
    dir="rtl"
    v-on:change="updateValue"
    :readonly="!active"
  >
    <template v-for="(option, index) in options">
      <option
        :value="option.value"
        :key="index"
        :selected="option.value === value"
      >
        {{ option.text }}
      </option>
    </template>
  </select>
</template>
<style scoped>
  * {
    color: white;
    font-size: 12px
  }
  select {
    width: 100%;
    padding-right: 5px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.26);
    border-radius: 0px;
  }
  select.updated {
    border: solid blue 2px;
  }
</style>
<script>
export default {
  name: 'ActiveOrderPageCardBodySelect',
  props: {
    value: { type: String, require: true },
    options: { type: Array, require: true },
    active: { type: Boolean, default: false } 
  },
  data () {
    return {
    }
  },
  methods: {
    updateValue: function (e) {
      this.$emit('input', e.target.value)
      this.$emit('change', e.target.value)
    }
  },
  mounted () {
    this.$emit('input', this.value)
  }
}
</script>
