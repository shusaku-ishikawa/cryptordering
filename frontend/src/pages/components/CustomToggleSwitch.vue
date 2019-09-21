<template>
  <div>
    <button
      type="button"
      :disabled="!active"
      v-on:click="turnOff"
      v-bind:class="{ off: true, active: !this.value }"
    >
      {{ caption.off }}
    </button>
    <button
      :disabled="!active"
      type="button"
      v-on:click="turnOn"
      v-bind:class="{ on: true, active: this.value }"
    >
      {{ caption.on }}
    </button>
  </div>
</template>
<style scoped>
  * {
    color: white
  }
  div {
    width: 100%;
    text-align: center;
    white-space: nowrap;
    font-size: 0;
    text-align: center
  }
  button {
    font-size: 14px;
    border: none;
    box-shadow: 0 1px 4px rgba(0, 0, 0, .6);
    margin: 0;
    width: 50%
  }
  button.off.active {
    background-color: teal
  }
  button.on.active {
    background-color: red;
  }
  button:disabled {
    color:gray
  }
  button.active:disabled {
    background-color: #555555
  }
</style>

<script>
export default {
  name: 'CustomToggleSwitch',
  props: {
    value: { type: Boolean },
    caption: { type: Object },
    active: { type: Boolean, default: true }
  },
  methods: {
    turnOn: function () {
      if (!this.value) {
        this.$emit('input', true)
      }
    },
    turnOff: function () {
      if (this.value) {
        this.$emit('input', false)
      }
    }
  },
  mounted () {
  }
}
</script>
