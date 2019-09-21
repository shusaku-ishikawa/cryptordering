<template>
  <transition name="modal">
    <div class="modal-mask">
      <div class="modal-wrapper">
        <div
          class="modal-container"
          v-bind:class="{ error: isError, success: !isError }"
        >
          <div
            class="modal-header"
          >
            <slot name="header">
            </slot>
          </div>
          <div class="modal-body">
            <slot name="body">
            </slot>
          </div>
          <div class="modal-footer">
            <v-btn
              text
              color="black"
              v-on:click="$emit('close')">
              閉じる
            </v-btn>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'Modal',
  props: {
    isError: { type: Boolean }
  }
}
</script>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .error {
    background-color: red;
    color:white
  }
  .success {
    background-color: lightgreen;
    color: white
  }
  .modal-mask {
    position: fixed;
    z-index: 99999;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, .5);
    display: table;
    transition: opacity .3s ease;
  }
  .modal-wrapper {
    display: table-cell;
    vertical-align: middle;
  }
  .modal-container {
    width: 300px;
    margin: 0px auto;
    padding: 20px 30px;
    background-color: #fff;
    border-radius: 2px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, .33);
    transition: all .3s ease;
    font-family: Helvetica, Arial, sans-serif;
  }
  .modal-header h3 {
    margin-top: 0;
    color: #42b983;
  }
  .modal-body {
    margin: 20px 0;
  }
  .modal-enter {
    opacity: 0;
  }
  .modal-leave-active {
    opacity: 0;
  }
  .modal-enter .modal-container,
  .modal-leave-active .modal-container {
    -webkit-transform: scale(1.1);
    transform: scale(1.1);
  }
</style>
