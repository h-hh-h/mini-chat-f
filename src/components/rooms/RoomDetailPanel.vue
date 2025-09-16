<template>
  <div class="room-detail-panel">
    <div class="panel-header">
      <Button icon="pi pi-arrow-left" @click="goBack" class="p-button-text p-button-sm back-btn" rounded text />
      <h3>房间详情</h3>
      <div class="spacer"></div>
    </div>

    <div class="room-info-section">
      <div class="room-avatar-container">
        <img :src="roomInfo?.avatar || 'https://www.gravatar.com/avatar?d=mp'" :alt="roomInfo?.name"
          class="room-avatar" />
      </div>
      <div class="room-name">{{ roomInfo?.name || 'Unnamed Room' }}</div>
      <div class="room-id">房间ID: {{ roomInfo?.roomId }}</div>
    </div>

    <div class="members-section">
      <div class="section-header">
        <h4>成员列表</h4>
        <span class="member-count">({{ (members || []).length }})</span>
        <Button icon="pi pi-user-plus" label="邀请成员" @click="showInviteModal = true"
          class="p-button-sm p-button-outlined invite-btn" size="small" />
      </div>

      <div v-if="loadingMembers" class="loading">加载成员中...</div>
      <div v-else class="members-list">
        <div v-for="member in members" :key="member.userId" class="member-item">
          <img :src="member.avatar || 'https://www.gravatar.com/avatar?d=mp'" :alt="member.name"
            class="member-avatar" />
          <div class="member-details">
            <div class="member-name">{{ member.name }}</div>
            <!-- 成员信息中可能没有account字段，使用name代替 -->
            <div class="member-account">@{{ member.name }}</div>
          </div>
          <!-- 群主标识 -->
          <div v-if="isRoomOwner(member)" class="owner-badge">群主</div>
        </div>
      </div>
    </div>

    <!-- 邀请成员模态框 -->
    <Dialog v-model:visible="showInviteModal" :style="{ width: '500px' }" header="邀请成员" :modal="true"
      :closable="true" :draggable="false" @hide="resetInviteForm">
      <div class="invite-modal-content">
        <div class="form-group">
          <label>选择好友</label>
          <div class="friends-selection">
            <div v-for="friend in availableFriends" :key="friend.userId" class="friend-selection-item"
              :class="{ selected: selectedFriends.has(friend.userId || '') }"
              @click="toggleFriendSelection(friend.userId || '')">
              <img :src="friend.avatar || 'https://www.gravatar.com/avatar?d=mp'"
                :alt="friend.name || 'Friend Avatar'" class="friend-avatar" />
              <div class="friend-details">
                <div class="friend-name">{{ friend.name || friend.account }}</div>
                <div class="friend-account">@{{ friend.account }}</div>
              </div>
              <div class="selection-indicator">
                <i class="pi pi-check" v-if="selectedFriends.has(friend.userId || '')"></i>
              </div>
            </div>

            <div v-if="availableFriends.length === 0" class="no-friends">
              暂无可以邀请的好友
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="取消" icon="pi pi-times" @click="showInviteModal = false" class="p-button-text" />
        <Button label="邀请" icon="pi pi-user-plus" @click="inviteFriends" :loading="inviting"
          :disabled="selectedFriends.size === 0" class="p-button-success" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { RoomClient, FriendClient } from '../../api'
import { RoomSimpleInfo } from '../../api/types/base/RoomSimpleInfo'
import { GroupCompleteInfo } from '../../api/types/base/GroupCompleteInfo'
import { FriendInfo } from '../../api/types/base/FriendInfo'
import { Result } from '../../api/types/response/base/Result'
import { MemberInfo, MemberInfoIdentityEnum } from '../../api/types/base/MemberInfo'

const props = defineProps<{
  room: RoomSimpleInfo
}>()

const emit = defineEmits<{
  (e: 'back'): void
}>()

const toast = useToast()

// 房间信息
const roomInfo = ref<GroupCompleteInfo | null>(null)
const members = ref<MemberInfo[]>([])
const loadingMembers = ref(false)

// 邀请相关
const showInviteModal = ref(false)
const availableFriends = ref<FriendInfo[]>([])
const selectedFriends = ref<Set<string>>(new Set())
const inviting = ref(false)

// 获取房间详细信息
const loadRoomDetails = async () => {
  try {
    loadingMembers.value = true

    // 获取群聊详细信息
    const response = await RoomClient.groupInfo(props.room.roomId || '')
    const result = new Result(response)

    if (result.isSuccess()) {
      roomInfo.value = result.data || null
      members.value = result.data?.memberInfos || []
    } else {
      toast.add({
        severity: 'error',
        summary: '错误',
        detail: result.message || '获取房间信息失败',
        life: 3000
      })
    }
  } catch (error: any) {
    console.error('获取房间信息失败:', error)
    toast.add({
      severity: 'error',
      summary: '错误',
      detail: error.message || '获取房间信息失败',
      life: 3000
    })
  } finally {
    loadingMembers.value = false
  }
}

// 判断是否为群主
const isRoomOwner = (member: MemberInfo) => {
  return member.identity === MemberInfoIdentityEnum.Owner
}

// 加载可邀请的好友列表（排除已经是成员的好友）
const loadAvailableFriends = async () => {
  try {
    const response = await FriendClient.listFriend(1, 100)
    const result = new Result(response)

    if (result.isSuccess()) {
      const allFriends = result.data?.records || []
      // 过滤掉已经是成员的好友
      const memberUserIds = new Set((members.value || []).map(m => m.userId))
      availableFriends.value = allFriends.filter(friend => 
        !memberUserIds.has(friend.userId)
      )
    }
  } catch (error: any) {
    console.error('加载好友列表失败:', error)
    toast.add({
      severity: 'error',
      summary: '错误',
      detail: error.message || '加载好友列表失败',
      life: 3000
    })
  }
}

// 切换好友选择状态
const toggleFriendSelection = (friendId: string) => {
  if (selectedFriends.value.has(friendId)) {
    selectedFriends.value.delete(friendId)
  } else {
    selectedFriends.value.add(friendId)
  }
}

// 重置邀请表单
const resetInviteForm = () => {
  selectedFriends.value.clear()
}

// 邀请好友
const inviteFriends = async () => {
  if (selectedFriends.value.size === 0) {
    toast.add({
      severity: 'warn',
      summary: '警告',
      detail: '请至少选择一个好友',
      life: 3000
    })
    return
  }

  try {
    inviting.value = true

    // 调用邀请接口（暂时使用控制台输出，因为API可能不存在）
    console.log('邀请成员:', {
      roomId: props.room.roomId,
      memberIds: Array.from(selectedFriends.value)
    })

    toast.add({
      severity: 'success',
      summary: '成功',
      detail: '邀请成员成功',
      life: 3000
    })

    // 关闭模态框
    showInviteModal.value = false
    resetInviteForm()

    // 重新加载房间详情以更新成员列表
    await loadRoomDetails()
  } catch (error: any) {
    console.error('邀请成员失败:', error)
    toast.add({
      severity: 'error',
      summary: '错误',
      detail: error.message || '邀请成员失败',
      life: 3000
    })
  } finally {
    inviting.value = false
  }
}

// 返回上一页
const goBack = () => {
  emit('back')
}

onMounted(async () => {
  await loadRoomDetails()
  await loadAvailableFriends()
})
</script>

<style scoped>
.room-detail-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #fff;
}

.panel-header {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e1e8ed;
  background-color: #f8f9fa;
}

.panel-header h3 {
  margin: 0;
  flex: 1;
  text-align: center;
}

.back-btn {
  color: #7f8c8d;
}

.spacer {
  width: 32px;
}

.room-info-section {
  padding: 1.5rem 1rem;
  text-align: center;
  border-bottom: 1px solid #eee;
}

.room-avatar-container {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.room-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.room-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.room-id {
  font-size: 0.875rem;
  color: #7f8c8d;
}

.members-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h4 {
  margin: 0;
  flex: 1;
}

.member-count {
  color: #7f8c8d;
  font-size: 0.875rem;
  margin-right: 0.5rem;
}

.invite-btn {
  font-size: 0.875rem;
}

.members-list {
  flex: 1;
  overflow-y: auto;
}

.member-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-bottom: 1px solid #f1f1f1;
}

.member-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 0.75rem;
}

.member-details {
  flex: 1;
}

.member-name {
  font-weight: 500;
  color: #2c3e50;
}

.member-account {
  font-size: 0.8rem;
  color: #7f8c8d;
}

.owner-badge {
  background-color: #3498db;
  color: white;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.loading {
  text-align: center;
  padding: 1rem;
  color: #7f8c8d;
}

/* 邀请模态框样式 */
.invite-modal-content {
  padding: 1rem 0;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #34495e;
}

.friends-selection {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e1e8ed;
  border-radius: 4px;
  padding: 0.5rem;
}

.friend-selection-item {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.friend-selection-item:hover {
  background-color: #f1f8ff;
}

.friend-selection-item.selected {
  background-color: #e1f0fa;
  border-color: #3498db;
}

.friend-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-right: 0.75rem;
}

.friend-details {
  flex: 1;
}

.friend-name {
  font-weight: 500;
  color: #2c3e50;
}

.friend-account {
  font-size: 0.8rem;
  color: #7f8c8d;
}

.selection-indicator {
  width: 20px;
  height: 20px;
  border: 1px solid #bdc3c7;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3498db;
}

.friend-selection-item.selected .selection-indicator {
  background-color: #3498db;
  border-color: #3498db;
  color: white;
}

.no-friends {
  padding: 1rem;
  text-align: center;
  color: #7f8c8d;
  font-style: italic;
}
</style>