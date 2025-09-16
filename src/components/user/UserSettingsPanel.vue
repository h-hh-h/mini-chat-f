<script lang="ts">
import { ref, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { UserInfoVo } from '../../api/types/request/UserInfoVo'

export default {
  props: {
    userInfo: {
      type: Object as () => UserInfoVo,
      required: true
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const toast = useToast()

    // User info update form
    const userInfoForm = ref({
      nickName: '',
      avatar: '',
      phone: '',
      email: ''
    })

    const updatingUserInfo = ref(false)

    // 初始化表单数据
    watch(() => props.userInfo, (newUserInfo) => {
      userInfoForm.value.nickName = newUserInfo.nickName || ''
      userInfoForm.value.avatar = newUserInfo.avatar || ''
      userInfoForm.value.phone = newUserInfo.phone || ''
      userInfoForm.value.email = newUserInfo.email || ''
    }, { immediate: true })

    // 更新用户信息
    const updateUserInfo = async () => {
      try {
        updatingUserInfo.value = true

        // 这里应该调用API更新用户信息
        // 暂时只更新本地数据作为示例
        // 实际应用中应该调用API更新用户信息
        toast.add({ severity: 'success', summary: '成功', detail: '用户信息已更新', life: 3000 })
        emit('close')
      } catch (error: any) {
        console.error('更新用户信息失败:', error)
        toast.add({ severity: 'error', summary: '错误', detail: error.message || '更新用户信息失败', life: 3000 })
      } finally {
        updatingUserInfo.value = false
      }
    }

    return {
      userInfoForm,
      updatingUserInfo,
      updateUserInfo
    }
  }
}
</script>

<template>
  <div class="user-settings-panel">
    <div class="panel-header">
      <h3>User Settings</h3>
      <Button icon="pi pi-times" @click="$emit('close')" class="p-button-text p-button-sm close-btn" rounded text />
    </div>

    <div class="settings-content">
      <div class="form-group">
        <label for="nickName">Nickname</label>
        <InputText id="nickName" v-model="userInfoForm.nickName" placeholder="Enter your nickname" />
      </div>

      <div class="form-group">
        <label for="avatar">Avatar URL</label>
        <InputText id="avatar" v-model="userInfoForm.avatar" placeholder="Enter avatar URL" />
      </div>

      <div class="form-group">
        <label for="phone">Phone</label>
        <InputText id="phone" v-model="userInfoForm.phone" placeholder="Enter your phone number" />
      </div>

      <div class="form-group">
        <label for="email">Email</label>
        <InputText id="email" v-model="userInfoForm.email" placeholder="Enter your email" />
      </div>

      <div class="form-actions">
        <Button label="Cancel" @click="$emit('close')" class="p-button-text" />
        <Button label="Save" @click="updateUserInfo" :loading="updatingUserInfo" class="p-button-success" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-settings-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid #e1e8ed;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #e1e8ed;
  background-color: #f0f8ff;
}

.panel-header h3 {
  margin: 0;
  font-size: 19px;
  color: #2c3e50;
  font-weight: 600;
}

.close-btn {
  width: 34px;
  height: 34px;
  background-color: #e1f0fa;
  color: #3498db;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background-color: #d1e7f5;
  transform: rotate(90deg);
}

.settings-content {
  flex: 1;
  padding: 20px;
  background-color: #fafcff;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #2c3e50;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e1e8ed;
}
</style>