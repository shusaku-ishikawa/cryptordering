<template>
  <v-app id="app">
    <div>
      <Navbar />
      <flash-message class="myCustomClass"></flash-message>
      <router-view/>
    </div>
  </v-app>
</template>
<script>
import Navbar from '@/components/navbar'
export default {
  name: 'App',
  components: { Navbar },
  data () {
    return {

    }
  }
}
</script>

<style>
@import './assets/css/loading.css';

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
