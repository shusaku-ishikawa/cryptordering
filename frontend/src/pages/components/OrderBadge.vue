<template>
  <span
    v-bind:class="position"
  >
    {{ position | toReadablePosition }}
  </span>
</template>
<style scoped>
  span {
    font-size: 10px;
    padding: 3px;
    border-radius: 5px;
    font-weight: bold;
    box-shadow: 2px 2px 1px rgba(0,0,0,0.4);
  }
  span.order1 {
    background-color: teal
  }
  span.order2 {
    background-color: green
  }
  span.order3 {
    background-color: blue
  }
</style>
<script>

export default {
  name: 'OrderBadge',
  components: {
  },
  computed: {
  },
  data () {
    return {

    }
  },
  props: {
    position: { type: String, require: true }
  },
  filters: {
    toReadablePosition: function (val) {
      if (val === 'order1') {
        return '新規注文'
      } else if (val === 'order2') {
        return '決済注文①'
      } else if (val === 'order3') {
        return '決済注文②'
      }
    }
  }
}
</script>
