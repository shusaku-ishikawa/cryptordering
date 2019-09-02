<template>
  <v-container>
    <v-row>
      <v-col
        md="3"
      >
        <v-btn
          v-bind:color="buttonColor"
          v-on:click="$emit('click', 25)"
        >
            25%
        </v-btn>
      </v-col>
      <v-col
        md="3"
      >
        <v-btn
          v-bind:color="buttonColor"
          v-on:click="$emit('click', 50)"
        >
            50%
        </v-btn>
      </v-col>
      <v-col
        md="3"
      >
        <v-btn
          v-bind:color="buttonColor"
          value="75"
          v-on:click="$emit('click', 75)"    
        >
            75%
        </v-btn>
      </v-col>
      <v-col
        md="3"
      >
        <v-btn
          v-bind:color="buttonColor"
          value="100"
          v-on:click="$emit('click', 100)"  
        >
            100%
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
export default {
  name: 'OrderQtyPercButtons',
  data () {
    return {
      color: 'teal'
    }
  },
  props: {
    buttonColor: { type: String }
  }
}
</script>
