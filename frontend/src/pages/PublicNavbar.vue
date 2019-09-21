<template>
  <div>
    <router-link
      v-for="(route, index) in this.routes"
      v-on:click.native="$emit('input', route.name)"
      v-bind:class="{ selected: route.name === value }"
      v-bind:key="index"
      :to="{name: route.name}"
      tag="button">
      <span>{{ route.meta.caption }}</span>
    </router-link>
  </div>
</template>
<script>
export default {
  props: {
    routes: { type: Array, require: true },
    value: { type: String, require: true }
  },
  data () {
    return {
    }
  }
}
</script>
<style scoped>
  * {
    color:white
  }
  div {
    width: 100%;
    text-align: center;
    white-space: nowrap;
    font-size: 0;
    text-align: center;
    margin-bottom: 10px;
  }
  button {
    font-size: 14px;
    border: none;
    box-shadow: 0 1px 1px #222222;
    margin: 0;
    width: calc(100%/3);
    height: 40px;
  }
  button.selected {
    background-color: #444444;
  }
</style>
