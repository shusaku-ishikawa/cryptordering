<template>
  <div class="wrapper">
    <span class="prepend">
      {{ placeholder }}
    </span>
    <div class="body">
      <select dir="rtl" :name="name" @change="updateValue">
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
    font-size: 14px
  }
  div.wrapper {
    background-color: #444444;
    box-shadow: 0 2px 5px rgba(0,0,0,0.26);
    margin: 10px 0px;
  }
  span.prepend, div.body {
    display: inline-block;
    /* margin: none;
    padding: none; */
  }
  span.prepend {
    width: 25%;
    text-align: left
  }
  div.body {
    width: 70%;
    /* padding-left: 0 */
  }
  select {
    width: 100%;
    height: 30px;
    padding-right: 5px;
  }

</style>

<script>
export default {
  name: 'CustomSelect',
  props: {
    value: { type: String, require: true },
    placeholder: { type: String, require: true },
    options: { type: Array, require: true },
    name: { type: String, require: true }
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
