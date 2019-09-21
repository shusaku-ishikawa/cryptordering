<template>
  <div>
    <v-btn
      color="teal"
      v-on:click="pickImage"
    >
      画像を追加
    </v-btn>
    <input
      type="file"
      style="display: none;"
      ref="image"
      v-on:change="onFileChange"
      mulitple="multiple"
    >
    <div
      v-for="(uploadedImage,id) in uploadedImagesForView"
      class="uploadImage"
      :key="id"
    >
      <v-btn
        fab
        class="clearImage"
        color="primary"
        v-on:click="clearImage(id)"
      >
        <v-icon>
          clear
        </v-icon>
      </v-btn>
      <img
        :src="uploadedImage"
      />
    </div>
  </div>
</template>
<style scoped>
  .uploadImage {
    width: 100%;
    position: relative;
    text-align: center;
    vertical-align: middle;
    margin-top: 10px;
  }
  .uploadImage img {
    max-width:100%;
    max-height:100%;
  }
  .uploadImage button {
    position: absolute;
    top: -15px;
    right: -15px;
  }
  .uploadImage .clearImage {
    width: 30px;
    height: 30px;
  }
</style>
<script>
let fileMaxSize = 2000000
let fileMaxCount = 3
let fileExtensions = ['jpg', 'jpeg', 'png', 'bmp', 'gif']
export default {
  name: 'ContactPageFileInput',
  props: {
    value: { type: Array }
  },
  data () {
    return {
      post: {
        content: '',
        uploadedImages: []
      },
      uploadedImagesForView: [],
      isError: false,
      errorMessage: ''
    }
  },
  mounted () {
    this.post.uploadedImages = this.value
    this.value.forEach(file => {
      this.createImage(file)
    })
  },
  methods: {
    // ファイル選択を表示
    pickImage () {
      this.$refs.image.click()
    },
    // ファイルアップが完了したら動作
    onFileChange (e) {
      let files = e.target.files || e.dataTransfer.files
      var myFileType = files[0].type
      var fileTypeCheck = false
      for (var i = 0; i < fileExtensions.length; i++) {
        var fileExtension = fileExtensions[i]
        if (myFileType.indexOf(fileExtension) > -1) {
          fileTypeCheck = true
          break
        }
      }
      if (!fileTypeCheck) {
        this.isError = true
        this.errorMessage = 'アップロードできるファイルは画像のみです。'
        return
      }
      // ファイルサイズ
      if (files[0].size > fileMaxSize) {
        this.isError = true
        this.errorMessage = 'ファイルサイズが大きすぎます。'
        return
      }
      // ファイル枚数
      if (this.post.uploadedImages.length + 1 > fileMaxCount) {
        this.isError = true
        this.errorMessage = 'アップロードできるファイルは最大' + fileMaxCount + 'ファイルです。'
        return
      }
      this.post.uploadedImages.push(files[0])
      this.createImage(files[0])
      this.$emit('input', this.post.uploadedImages)
      this.$emit('change', this.post.uploadedImages)
    },
    // アップロードした画像を表示
    createImage (file) {
      let reader = new FileReader()
      reader.onload = (e) => {
        var uploadedImage = e.target.result
        this.uploadedImagesForView.push(uploadedImage)
      }
      reader.readAsDataURL(file)
    },
    clearImage (id) {
      this.uploadedImagesForView.splice(id, 1)
      this.post.uploadedImages.splice(id, 1)
      this.$emit('input', this.post.uploadedImages)
      this.$emit('change', this.post.uploadedImages)
    }
  },
  components: {
  }
}
</script>
