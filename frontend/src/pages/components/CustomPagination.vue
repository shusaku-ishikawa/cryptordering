<template>
  <div>
    <CustomPaginationCommandButton
      :disabled="!hasPrevious"
      v-on:click="onPrevious"
      caption="<"
    />
    <CustomPaginationButton
      :isActive="value === 1"
      :disabled="false"
      :value="1"
      v-on:click="$emit('input', $event)"
    />
    <span
      v-if="isFrontFlooded"
    >
      ・・
    </span>
    <CustomPaginationButton
      v-for="page in visiblePages"
      :isActive="value === page"
      v-bind:key="page"
      :disabled="false"
      :value="page"
      v-on:click="$emit('input', $event)"
    />
    <span
      v-if="isPostFlooded"
    >
      ・・
    </span>
    <CustomPaginationButton
      v-if="length > 1"
      :isActive="value === length"
      :disabled="false"
      :value="length"
      v-on:click="$emit('input', $event)"
    />
    <CustomPaginationCommandButton
      :disabled="!hasNext"
      v-on:click="onNext"
      caption=">"
    />
  </div>
</template>
<style scoped>
  span {
    color: white
  }
</style>
<script>
import CustomPaginationButton from './CustomPaginationButton'
import CustomPaginationCommandButton from './CustomPaginationCommandButton'
export default {
  components: {
    CustomPaginationButton,
    CustomPaginationCommandButton
  },
  props: {
    value: { type: Number, require: true },
    length: { type: Number, require: true },
    totalVisible: { type: Number, default: 10 }
  },
  methods: {
    onNext: function () {
      if (this.hasNext) {
        this.$emit('input', this.value + 1)
      }
    },
    onPrevious: function () {
      if (this.hasPrevious) {
        this.$emit('input', this.value - 1)
      }
    }
  },
  computed: {
    hasNext: function () {
      return this.value < this.length
    },
    hasPrevious: function () {
      return this.value > 1
    },
    frontVisible: function () {
      let def = Math.ceil((this.totalVisible - 3) / 2)
      let defPost = Math.floor((this.totalVisible - 3) / 2)
      if (defPost > (this.length - this.value - 1)) {
        def += defPost - (this.length - this.value - 1)
      }
      let count
      if (this.value - 2 < def) {
        count = this.value - 2
      } else {
        count = def
      }
      let pages = []
      for (let i = this.value - count; i < this.value; i++) {
        pages.push(i)
      }
      console.log((pages))
      return pages
    },
    visibleStart: function () {
      if (this.frontVisible.length > 0) {
        return this.frontVisible[0]
      } else {
        if (this.value === 1) {
          return this.value + 1
        } else {
          return this.value
        }
      }
    },
    visibleEnd: function () {
      if (this.postVisible.length > 0) {
        return this.postVisible[this.postVisible.length - 1]
      } else {
        if (this.value === this.length) {
          return this.value - 1
        } else {
          return this.value
        }
      }
    },
    postVisible: function () {
      let def = this.totalVisible - 3 - this.frontVisible.length
      if (this.value === 1) {
        def += 1
      }
      let count
      if (this.length - this.value - 1 < def) {
        count = this.length - this.value - 1
      } else {
        count = def
      }
      let pages = []
      for (let i = this.value + 1; i <= this.value + count; i++) {
        pages.push(i)
      }
      return pages
    },
    isFrontFlooded: function () {
      return (this.frontVisible.length > 0 && this.frontVisible[0] > 2)
    },
    isPostFlooded: function () {
      return (this.postVisible.length > 0 && this.postVisible[this.postVisible.length - 1] < this.length - 1)
    },
    allPages: function () {
      return [...Array(this.length).keys()].map(i => ++i)
    },
    visiblePages: function () {
      let re = []
      for (let i = this.visibleStart; i <= this.visibleEnd; i++) {
        re.push(i)
      }
      return re
    }
  },
  data () {
    return {
    }
  },
  created () {

  }
}
</script>
