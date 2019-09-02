<template>
  <div class="wrapper">
    <div class="prepend">
      {{ placeholder }}
    </div>
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
    color: white
  }
  div.wrapper {
    background-color: #444444;
    box-shadow: 0 2px 5px rgba(0,0,0,0.26);
    margin: 10px 0px
  }
  div.prepend, div.body {
    display: inline-block;
    /* margin: none;
    padding: none; */
  }
  div.prepend {
    width: 19%;
    /* padding-right: 0 */
  }
  div.body {
    width: 80%;
    /* padding-left: 0 */
  }
  select {
    width: 100%;
    padding-right: 5px;
  }

</style>

<script>
export default {
  name: 'MySelect',
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
