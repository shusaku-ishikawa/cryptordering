<template>
  <div>
    <table>
      <tr>
        <th>
          問い合せ日時
        </th>
        <td>
          {{ form.data.time }}
        </td>
      </tr>
      <tr>
        <th>
          名前
        </th>
        <td>
          <CustomTextInput
            v-model="form.data.name"
          />
        </td>
      </tr>
      <tr>
        <th>
          メールアドレス
        </th>
        <td>
          <CustomTextInput
            v-model="form.data.email_for_reply"
          />
        </td>
      </tr>

      <tr>
        <th>
          件名
        </th>
        <td>
          <CustomTextInput
            v-model="form.data.subject"
          />
        </td>
      </tr>
      <tr>
        <th>
          内容
        </th>
        <td>
          <CustomTextArea
            v-model="form.data.body"
          />
        </td>
      </tr>
      <tr>
        <th>
          添付ファイル
        </th>
        <td>
          <ContactPageFileInput
            v-model="form.data.attachments"
          />
        </td>
      </tr>
    </table>
    <v-btn
      color="teal"
      block
      class="submit"
      :loading="processing"
      :disabled="processing"
      v-on:click="postContact"
    >
      送信
    </v-btn>
   </div>
</template>
<style scoped>
  table {
    color: white;
    width: 100%;
    border: none;
    border-collapse:collapse;
    table-layout: fixed
  }
  tr {
    border-bottom: groove darkgray 1px;
  }
  th {
    text-align: left;
    width: 40%;
  }
  td {
    width: 60%;
    text-align: right;
    padding: 3px;
  }
  button.submit {
    margin-top: 10px
  }
</style>
<script>
import moment from 'moment'
import CustomTextInput from './components/CustomTextInput'
import CustomTextArea from './components/CustomTextArea'
import ContactPageFileInput from './components/ContactPageFileInput'

export default {
  components: {
    CustomTextInput,
    CustomTextArea,
    ContactPageFileInput
  },
  data () {
    return {
      processing: false,
      form: {
        data: {
          time: moment().format('YYYY/MM/DD HH:mm'),
          id: '',
          name: '',
          email_for_reply: '',
          subject: '',
          body: '',
          attachments: []
        }
      }
    }
  },
  watch: {
    'form.data.attachments': function () {
      console.log(this.form.data.attachments)
    }
  },
  async created () {
    this.$emit('loading', true)
    try {
      let result = await this.$store.dispatch(
        'http/get',
        { url: this.$store.getters['auth/userInfoGetUrl'] },
        { root: true }
      )
      this.form.data.id = result.data.id
      this.form.data.name = result.data.full_name
      this.form.data.email_for_reply = result.data.email_for_notice
    } catch (err) {
      throw err
    }
    this.$emit('loading', false)
  },
  methods: {
    postContact: async function () {
      this.processing = true
      let config = {
        headers: {
          'content-type': 'multipart/form-data'
        }
      }
      var formData = new FormData()
      formData.append('subject', this.form.data.subject)
      formData.append('body', this.form.data.body)
      formData.append('email_for_reply', this.form.data.email_for_reply)
      for (var i = 1; i <= this.form.data.attachments.length; i++) {
        var name = 'attachment_' + i
        formData.append(name, this.form.data.attachments[i - 1])
      }
      let url_ = 'contact/'
      try {
        await this.$store.dispatch(
          'http/post',
          { url: url_, data: formData, config: config },
          { root: true }
        )
        this.flash('問い合せが完了しました', 'success', {
          timeout: 3000
        })
      } catch (err) {
        console.log(err)
      }
      this.processing = false
    }
  }
}
</script>
