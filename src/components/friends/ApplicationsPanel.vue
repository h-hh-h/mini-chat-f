<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { ApplyClient, UserClient } from '../../api'
import { ApplyResp, ApplyRespStatusEnum } from '../../api/types/response/ApplyResp'
import { ApplyBatchReq } from '../../api/types/request/ApplyBatchReq'
import { ApplyReq } from '../../api/types/request/ApplyReq'
import { UserInfoVo as UserInfo } from '../../api/types/request/UserInfoVo'
import { Result } from '../../api/types/response/base/Result'

const toast = useToast()
const emit = defineEmits(['close'])

// 导出枚举给模板使用
const applyRespStatus = ApplyRespStatusEnum

// Friend applications
const friendApplications = ref<ApplyResp[]>([])
const loadingApplications = ref(false)
const applicationTab = ref<'received' | 'sent'>('received')

// Friend search and application
const searchAccount = ref('')
const searchResult = ref<UserInfo | null>(null)
const searching = ref(false)
const searchError = ref('')

// Check if we're in test mode (no authentication)
const isTestMode = window.location.hash.includes('im-test') || window.location.pathname.includes('im-test')

// 页面加载时初始化
onMounted(async () => {
  await loadFriendApplications()
})

// 加载好友申请
const loadFriendApplications = async () => {
  try {
    loadingApplications.value = true
    friendApplications.value = [] // 清空之前的数据

    if (isTestMode) {
      // 测试模式下模拟好友申请
      friendApplications.value = [
        {
          applyId: 'apply-1',
          account: 'friend1',
          nickName: 'Friend One',
          status: ApplyRespStatusEnum.Wait,
          remarks: 'Hello, I would like to add you as a friend',
          createTime: new Date()
        },
        {
          applyId: 'apply-2',
          account: 'friend2',
          nickName: 'Friend Two',
          status: ApplyRespStatusEnum.Wait,
          remarks: 'We work together',
          createTime: new Date(Date.now() - 866400000)
        }
      ]
      loadingApplications.value = false
      return
    }

    const type = applicationTab.value === 'received' ? 'RECEIVE' : 'REQUEST'
    const response = await ApplyClient.listApply(type)
    const result = new Result(response)
    if (result.isSuccess()) {
      friendApplications.value = result.data || []
    } else {
      toast.add({ severity: 'error', summary: '错误', detail: result.message || '获取好友申请失败', life: 3000 })
    }
  } catch (error: any) {
    if (isTestMode) {
      friendApplications.value = [
        {
          applyId: 'apply-1',
          account: 'friend1',
          nickName: 'Friend One',
          status: ApplyRespStatusEnum.Wait,
          remarks: 'Hello, I would like to add you as a friend',
          createTime: new Date()
        }
      ]
    } else {
      toast.add({ severity: 'error', summary: '错误', detail: error.message || '获取好友申请失败', life: 3000 })
    }
  } finally {
    loadingApplications.value = false
  }
}

// 切换好友申请标签
const switchApplicationTab = async (tab: 'received' | 'sent') => {
  applicationTab.value = tab
  await loadFriendApplications()
}

// 格式化申请日期
const formatApplicationDate = (date: Date | string | undefined) => {
  if (!date) return ''

  // 如果已经是Date对象
  if (date instanceof Date) {
    return date.toLocaleDateString()
  }

  // 如果是字符串，尝试解析为日期
  if (typeof date === 'string') {
    const parsedDate = new Date(date)
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleDateString()
    }
    return date // 如果无法解析，则返回原始字符串
  }

  return ''
}

// 接受好友申请
const acceptFriendApplication = async (application: ApplyResp) => {
  try {
    const req = new ApplyBatchReq()
    req.applyIds = [application.applyId!]

    const response = await ApplyClient.agreeApply(req)
    const result = new Result(response)
    if (result.isSuccess()) {
      toast.add({ severity: 'success', summary: '成功', detail: '已接受好友申请', life: 3000 })
      // 重新加载申请列表
      await loadFriendApplications()
    } else {
      toast.add({ severity: 'error', summary: '错误', detail: result.message || '接受好友申请失败', life: 3000 })
    }
  } catch (error: any) {
    console.error('接受好友申请失败:', error)
    toast.add({ severity: 'error', summary: '错误', detail: error.message || '接受好友申请失败', life: 3000 })
  }
}

// 拒绝好友申请
const rejectFriendApplication = async (applyId: string) => {
  try {
    if (isTestMode) {
      // 测试模式下模拟拒绝好友申请
      const application = friendApplications.value.find(app => app.applyId === applyId)
      if (application) {
        application.status = ApplyRespStatusEnum.Reject
        toast.add({ severity: 'success', summary: '成功', detail: '好友申请已拒绝', life: 3000 })
      }
      return
    }

    const req: ApplyBatchReq = {
      applyIds: [applyId]
    }

    const response = await ApplyClient.deleteApply(req)
    const result = new Result(response)
    if (result.isSuccess()) {
      // 更新列表中的申请状态
      const application = friendApplications.value.find(app => app.applyId === applyId)
      if (application) {
        application.status = ApplyRespStatusEnum.Reject
      }
      toast.add({ severity: 'success', summary: '成功', detail: '好友申请已拒绝', life: 3000 })
    } else {
      toast.add({ severity: 'error', summary: '错误', detail: result.message || '拒绝好友申请失败', life: 3000 })
    }
  } catch (error: any) {
    toast.add({ severity: 'error', summary: '错误', detail: error.message || '拒绝好友申请失败', life: 3000 })
  }
}

// 搜索用户
const searchUser = async () => {
  if (!searchAccount.value.trim()) {
    return
  }

  try {
    searching.value = true
    searchError.value = ''

    if (isTestMode) {
      // 测试模式下模拟搜索结果
      searchResult.value = {
        userId: 'user-' + Date.now(),
        account: searchAccount.value,
        nickName: 'User ' + searchAccount.value,
        avatar: 'https://www.gravatar.com/avatar?d=mp'
      }
      return
    }

    const response = await UserClient.searchUser(searchAccount.value)
    const result = new Result(response)
    if (result.isSuccess()) {
      searchResult.value = result.data || null
      if (!searchResult.value) {
        searchError.value = '用户未找到'
      }
    } else {
      searchError.value = result.message || '搜索用户失败'
    }
  } catch (error: any) {
    searchError.value = error.message || '搜索用户失败'
  } finally {
    searching.value = false
  }
}

// 发送好友申请
const applyToAddFriend = async (friendId: string) => {
  try {
    if (isTestMode) {
      // 测试模式下模拟发送申请
      toast.add({ severity: 'success', summary: '成功', detail: '好友申请已发送', life: 3000 })
      searchResult.value = null
      searchAccount.value = ''
      return
    }

    const req: ApplyReq = {
      friendId: friendId,
      remark: '' // 未来可以添加备注输入框
    }

    const response = await ApplyClient.applyOne(req)
    const result = new Result(response)
    if (result.isSuccess()) {
      toast.add({ severity: 'success', summary: '成功', detail: '好友申请已发送', life: 3000 })
      searchResult.value = null
      searchAccount.value = ''
    } else {
      toast.add({ severity: 'error', summary: '错误', detail: result.message || '发送好友申请失败', life: 3000 })
    }
  } catch (error: any) {
    toast.add({ severity: 'error', summary: '错误', detail: error.message || '发送好友申请失败', life: 3000 })
  }
}

// 删除好友申请（仅限已发送的申请）
const deleteFriendApplication = async (applyId: string) => {
  try {
    if (isTestMode) {
      // 测试模式下模拟删除
      const application = friendApplications.value.find(app => app.applyId === applyId)
      if (application) {
        friendApplications.value = friendApplications.value.filter(app => app.applyId !== applyId)
      }
      toast.add({ severity: 'success', summary: '成功', detail: '好友申请已删除', life: 3000 })
      return
    }

    const req: ApplyBatchReq = {
      applyIds: [applyId]
    }

    const response = await ApplyClient.deleteApply(req)
    const result = new Result(response)
    if (result.isSuccess()) {
      // 从列表中移除申请
      friendApplications.value = friendApplications.value.filter(app => app.applyId !== applyId)
      toast.add({ severity: 'success', summary: '成功', detail: '好友申请已删除', life: 3000 })
    } else {
      toast.add({ severity: 'error', summary: '错误', detail: result.message || '删除好友申请失败', life: 3000 })
    }
  } catch (error: any) {
    toast.add({ severity: 'error', summary: '错误', detail: error.message || '删除好友申请失败', life: 3000 })
  }
}
</script>

<template>
  <div class="applications-panel">
    <div class="panel-header">
      <h3>Friend Applications</h3>
      <Button icon="pi pi-times" @click="$emit('close')" class="p-button-text p-button-sm close-btn" rounded text />
    </div>

    <div class="applications-content">
      <!-- Add Friend Section -->
      <div class="add-friend-section">
        <div class="section-header">
          <h4>Add Friend</h4>
        </div>
        <div class="search-box">
          <div class="p-inputgroup">
            <InputText v-model="searchAccount" placeholder="Enter user account" @keyup.enter="searchUser" />
            <Button icon="pi pi-search" @click="searchUser" :disabled="!searchAccount.trim() || searching"
              :loading="searching" />
          </div>
          <div v-if="searchError" class="search-error">{{ searchError }}</div>
        </div>

        <div v-if="searchResult" class="search-result">
          <div class="result-user">
            <img :src="searchResult.avatar || 'https://www.gravatar.com/avatar?d=mp'"
              :alt="searchResult.nickName || 'User Avatar'" class="result-avatar" />
            <div class="result-info">
              <div class="result-name">{{ searchResult.nickName || searchResult.account }}</div>
              <div class="result-account">@{{ searchResult.account }}</div>
            </div>
            <div class="apply-actions">
              <Button label="Add" icon="pi pi-user-plus" @click="applyToAddFriend(searchResult.userId || '')"
                class="p-button-success p-button-sm" size="small" />
            </div>
          </div>
        </div>
      </div>

      <!-- Friend Applications Section -->
      <div class="friend-applications-section">
        <div class="section-header applications-tabs">
          <button :class="['tab-button', { active: applicationTab === 'received' }]"
            @click="switchApplicationTab('received')">
            Received
          </button>
          <button :class="['tab-button', { active: applicationTab === 'sent' }]"
            @click="switchApplicationTab('sent')">
            Sent
          </button>
        </div>

        <div v-if="loadingApplications" class="loading">Loading applications...</div>
        <div v-else class="applications-list">
          <div v-for="application in friendApplications" :key="application.applyId" class="application-item"
            :class="{ 'application-wait': application.status === applyRespStatus.Wait }">
            <div class="application-info">
              <div class="application-user">
                <img :src="'https://www.gravatar.com/avatar?d=mp'" :alt="application.nickName || 'User Avatar'"
                  class="application-avatar" />
                <div class="application-user-info">
                  <div class="application-nickname">{{ application.nickName || application.account }}</div>
                  <div class="application-account">@{{ application.account }}</div>
                </div>
              </div>

              <div class="application-details">
                <div class="application-remarks">{{ application.remarks }}</div>
                <div class="application-date">{{ formatApplicationDate(application.createTime) }}</div>
              </div>

              <div v-if="applicationTab === 'received' && application.status === applyRespStatus.Wait"
                class="application-actions">
                <Button icon="pi pi-check" class="p-button-success p-button-sm accept-button"
                  @click="acceptFriendApplication(application)"
                  :disabled="application.status !== applyRespStatus.Wait" rounded text />
                <Button icon="pi pi-times" @click="rejectFriendApplication(application.applyId || '')"
                  class="p-button-danger p-button-sm" title="Reject" rounded text />
              </div>

              <div v-else-if="applicationTab === 'sent' && application.status === applyRespStatus.Wait"
                class="application-actions">
                <Button icon="pi pi-trash" @click="deleteFriendApplication(application.applyId || '')"
                  class="p-button-danger p-button-sm" title="Delete Application" rounded text />
              </div>

              <div v-else class="application-status" :class="`status-${application.status?.toLowerCase()}`">
                {{
                  application.status === applyRespStatus.Agree ? 'Accepted' :
                    application.status === applyRespStatus.Reject ? 'Rejected' :
                      'Pending'
                }}
              </div>
            </div>
          </div>

          <div v-if="friendApplications.length === 0" class="no-applications">
            No friend applications
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.applications-panel {
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

.applications-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  background-color: #fafcff;
}

.add-friend-section {
  padding: 20px;
  border-bottom: 1px solid #e1e8ed;
  background-color: #f8fbff;
}

.section-header {
  margin-bottom: 18px;
}

.section-header h4 {
  margin: 0;
  font-size: 17px;
  color: #2c3e50;
  font-weight: 600;
  position: relative;
  padding-bottom: 8px;
}

.section-header h4::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 40px;
  height: 3px;
  background: linear-gradient(to right, #3498db, #2c3e50);
  border-radius: 3px;
}

.search-box {
  margin-bottom: 20px;
}

.search-error {
  color: #e74c3c;
  font-size: 14px;
  margin-top: 8px;
  font-weight: 500;
}

.search-result {
  border: 1px solid #bee0f7;
  border-radius: 10px;
  padding: 15px;
  background: linear-gradient(to bottom, #e3f2fd, #bbdefb);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.result-user {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
}

.result-avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.result-info {
  flex: 1;
}

.result-info .result-name {
  font-weight: 600;
  font-size: 16px;
  color: #2c3e50;
}

.result-info .result-account {
  color: #7f8c8d;
  font-size: 14px;
}

.friend-applications-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.applications-tabs {
  display: flex;
  border-bottom: 1px solid #e1e8ed;
  padding: 0 12px;
  background-color: #f0f8ff;
}

.tab-button {
  flex: 1;
  padding: 14px;
  background: none;
  border: none;
}

.tab-button.active {
  border-bottom: 2px solid #3498db;
  color: #3498db;
}

.tab-button:hover {
  background-color: #e1f0fa;
}

.no-friends {
  text-align: center;
  padding: 30px;
  color: #95a5a6;
  font-size: 15px;
  font-weight: 500;
}

.tab-button {
  flex: 1;
  padding: 14px;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 600;
  color: #7f8c8d;
  font-size: 15px;
  transition: all 0.3s ease;
  position: relative;
}

.tab-button.active {
  color: #3498db;
}

.tab-button.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(to right, #3498db, #2c3e50);
  border-radius: 3px;
}

.tab-button:hover:not(.active) {
  background-color: #e1f0fa;
  color: #2c3e50;
}

.applications-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  background-color: #fafcff;
}

.application-item {
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 12px;
  border: 1px solid #d6eaf8;
  background: linear-gradient(to bottom, #ffffff, #f8fbff);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;
}

.application-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
}

.application-item.application-wait {
  border-color: #3498db;
  background: linear-gradient(to bottom, #e3f2fd, #bbdefb);
}

.application-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.application-user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.application-avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.application-user-info .application-nickname {
  font-weight: 600;
  font-size: 15px;
  color: #2c3e50;
}

.application-user-info .application-account {
  font-size: 13px;
  color: #7f8c8d;
}

.application-details {
  font-size: 14px;
}

.application-remarks {
  color: #34495e;
  margin-bottom: 8px;
  font-weight: 500;
  word-break: break-word;
}

.application-date {
  font-size: 12px;
  color: #95a5a6;
}

.application-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.application-status {
  text-align: right;
  font-weight: 600;
  font-size: 14px;
}

.application-status.status-agree {
  color: #27ae60;
}

.application-status.status-reject {
  color: #e74c3c;
}

.application-status.status-delete {
  color: #95a5a6;
}

.no-applications {
  text-align: center;
  padding: 30px;
  color: #95a5a6;
  font-size: 15px;
  font-weight: 500;
}

.loading {
  padding: 25px;
  text-align: center;
  color: #95a5a6;
  font-weight: 500;
}
</style>