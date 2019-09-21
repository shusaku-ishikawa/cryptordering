<template>
  <div
    class="wrapper"
    v-bind:class="{ inactive: !active }"
  >
   <span class="prepend">
      {{ placeholder }}
    </span>
    <div class="body">
      <select :disabled="!active" dir="rtl" :name="name" @change="updateValue">
        <template v-for="(option, index) in options">
          <option :value="option.value" :key="index">
            {{ option.text }}
          </option>
        </template>
      </select>
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
  
  span.prepend, div.body {
    display: inline-block;
    font-size: 12px;
  }
  span.prepend {
    padding-left: 5px;
    width: 30%;
    text-align: left;
    font-size: 12px;
  }
  div.body {
    width: 70%;
    /* padding-left: 0 */
  }
  
  select {
    width: 100%;
    height: 30px;
    padding-right: 10px;
    font-size: 12px;
  }
  div.wrapper.inactive span.prepend,
  div.wrapper.inactive select {
    color: gray;
  }

</style>

<script>
export default {
  name: 'CustomSelect',
  props: {
    value: { type: String, require: true },
    placeholder: { type: String, require: true },
    options: { type: Array, require: true },
    name: { type: String, require: true },
    active: { type: Boolean, default: true }
  },
  methods: {
    updateValue: function (e) {
      this.$emit('input', e.target.value)
      this.$emit('change', e.target.value)
    }
  },
  mounted () {
    this.$emit('input', this.options[0].value)
  }
}
</script>
