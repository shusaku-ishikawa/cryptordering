<template>
  <label>
    <span v-if="$slots.label"><slot name="label"></slot></span>
    <span v-else-if="label">{{ label }}</span>

    <input :type="type"
           :name="name"
           :placeholder="placeholder"
           :value="value"
           @input="updateValue"
           @focus="$emit('focus', $event)"
           @blur="$emit('blur', $event)"
    >
  </label>
</template>
<script>
  export default {
    name: 'CustomInput',
    props: {
      value: { type: String },
      label: { type: String },
      name: { type: String, require: true },
      type: { type: String, default: 'text' },
      placeholder: { type: String }
    },

    methods: {
      updateValue (e) {
        this.$emit('input', e.target.value)
        this.$emit('change', e.target.value)
      }
    }
  }
</script>
