<template>
  <textarea
    :value="value"
    @input="updateValue"
  ></textarea>
</template>
<style scoped>
  * {
    color: white;
  }
  textarea {
    width: 100%;
    background-color: #444444;
    padding: 3px 10px;
  }

</style>

<script>
export default {
  name: 'CustomTextArea',
  props: {
    value: { type: String, require: true }
  },
  methods: {
    updateValue: function (e) {
      this.$emit('input', e.target.value)
    }
  }
}
</script>
