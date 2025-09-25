<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { RoomClient } from '../../api'
import { Result } from '../../api/types/response/base/Result'
import { GroupCompleteInfo } from '../../api/types/base/GroupCompleteInfo'
import { MemberInfo, MemberInfoIdentityEnum } from '../../api/types/base/MemberInfo'
import { generateNicknameAvatar } from '../../utils/avatarUtils'
import { FriendClient } from '../../api'
import { CursorReq } from '../../api/types/request/CursorReq'
import { RoomSimpleInfo } from '../../api/types/base/RoomSimpleInfo'
import { FriendInfo } from '../../api/types/base/FriendInfo'

const props = defineProps<{
  room: RoomSimpleInfo
}>()

const emit = defineEmits<{
  (e: 'back'): void
}>()

const toast = useToast()

// 房间信息
const roomInfo = ref<GroupCompleteInfo | null>(null)
const loadingRoomInfo = ref(false)

// 成员列表
const members = ref<MemberInfo[]>([])
const loadingMembers = ref(false)

// 邀请成员相关状态
const showInviteModal = ref(false)
const availableFriends = ref<FriendInfo[]>([])
const selectedFriends = ref<Set<string>>(new Set())
const inviting = ref(false)

// 添加成员表单显示状态
const showAddMemberForm = ref(false)

// 当前登录用户ID (从会话中获取)
const currentUserId = 'user-1' // 这应该从实际会话中获取

// 获取房间详细信息
const loadRoomInfo = async () => {
  try {
    loadingRoomInfo.value = true
    
    // 模拟API调用
    const response = await RoomClient.groupInfo(props.room.roomId || '')
    const result = new Result(response)
    
    if (result.isSuccess()) {
      roomInfo.value = result.data || null
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
    loadingRoomInfo.value = false
  }
}

// 获取成员列表
const loadMembers = async () => {
  try {
    loadingMembers.value = true
    
    // 模拟API调用
    const req = new CursorReq()
    req.size = 100
    const response = await RoomClient.groupMembers(req)
    const result = new Result(response)
    
    if (result.isSuccess()) {
      members.value = result.data?.data || []
    } else {
      toast.add({
        severity: 'error',
        summary: '错误',
        detail: result.message || '获取成员列表失败',
        life: 3000
      })
    }
  } catch (error: any) {
    console.error('获取成员列表失败:', error)
    toast.add({
      severity: 'error',
      summary: '错误',
      detail: error.message || '获取成员列表失败',
      life: 3000
    })
  } finally {
    loadingMembers.value = false
  }
}

// 加载可邀请的好友列表
const loadAvailableFriends = async () => {
  try {
    // 获取所有好友
    const response = await FriendClient.listFriend(1, 100)
    const result = new Result(response)
    
    if (result.isSuccess()) {
      const allFriends = result.data?.records || []
      
      // 过滤掉已经是成员的好友
      const memberIds = new Set(members.value.map(m => m.userId))
      availableFriends.value = allFriends.filter(friend => 
        friend.userId && !memberIds.has(friend.userId)
      )
    } else {
      toast.add({
        severity: 'error',
        summary: '错误',
        detail: result.message || '获取好友列表失败',
        life: 3000
      })
    }
  } catch (error: any) {
    console.error('获取好友列表失败:', error)
    toast.add({
      severity: 'error',
      summary: '错误',
      detail: error.message || '获取好友列表失败',
      life: 3000
    })
  }
}

// 判断是否是房间所有者
const isRoomOwner = (room: GroupCompleteInfo | null) => {
  if (!room) return false
  return room.ownerId === currentUserId
}

// 返回上一页
const goBack = () => {
  emit('back')
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

// 移除成员
const removeMember = async (userId: string | undefined) => {
  if (!userId) {
    toast.add({
      severity: 'error',
      summary: '错误',
      detail: '无效的用户ID',
      life: 3000
    })
    return
  }

  try {
    // 这里应该调用实际的API来移除成员
    // 由于API中没有提供相关接口，暂时使用模拟方式
    
    // 从成员列表中移除
    members.value = members.value.filter(member => member.userId !== userId)
    
    toast.add({
      severity: 'success',
      summary: '成功',
      detail: '成员已移除',
      life: 3000
    })
  } catch (error: any) {
    console.error('移除成员失败:', error)
    toast.add({
      severity: 'error',
      summary: '错误',
      detail: error.message || '移除成员失败',
      life: 3000
    })
  }
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

    // 构造邀请请求
    const friendIds = Array.from(selectedFriends.value)
    
    // 模拟API调用 (暂时没有直接的邀请接口，可以使用加入群组接口)
    // 这里暂时留空，因为没有合适的API
    toast.add({
      severity: 'success',
      summary: '成功',
      detail: '邀请发送成功',
      life: 3000
    })
    
    // 关闭模态框
    showInviteModal.value = false
    
    // 重新加载成员列表
    await loadMembers()
  } catch (error: any) {
    console.error('邀请失败:', error)
    toast.add({
      severity: 'error',
      summary: '错误',
      detail: error.message || '邀请失败',
      life: 3000
    })
  } finally {
    inviting.value = false
  }
}

// 处理头像显示逻辑
function getAvatarUrl(avatar: string | null | undefined, name: string | undefined) {
  console.log('Processing avatar:', avatar, 'name:', name);
  
  // 检查是否是逗号分隔的多个头像
  if (avatar && avatar.includes(',')) {
    // 过滤掉无效值（包括null、undefined、空字符串和'null'字符串）
    const avatarUrls = avatar.split(',').filter(url => url && url.trim() !== '' && url !== 'null');
    console.log('Multiple avatars detected:', avatarUrls);
    if (avatarUrls.length > 0) {
      // 如果有有效的头像，生成九宫格头像
      return generateGroupAvatar(avatarUrls, name);
    } else {
      // 如果所有头像都无效，使用默认头像
      const defaultAvatar = generateNicknameAvatar(name);
      console.log('All avatars are invalid, using default avatar for name:', name, 'avatar:', defaultAvatar);
      return defaultAvatar;
    }
  }
  
  // 检查单个头像是否为无效值
  if (!avatar || avatar === 'null' || avatar.trim() === '') {
    const defaultAvatar = generateNicknameAvatar(name);
    console.log('Invalid single avatar, using default avatar for name:', name, 'avatar:', defaultAvatar);
    return defaultAvatar;
  }
  
  console.log('Using provided avatar:', avatar);
  return avatar;
}

// 生成群聊九宫格头像
function generateGroupAvatar(avatarUrls: string[], groupName: string | undefined): string {
  console.log('Generating group avatar with urls:', avatarUrls, 'group name:', groupName);
  
  // 处理每个头像，确保使用之前的用户头像逻辑（为null时使用默认的）
  const processedAvatars = avatarUrls.map((avatar, index) => {
    // 为每个头像生成一个默认名称（基于群名称和索引）
    const defaultName = groupName ? `${groupName}${index + 1}` : `Member${index + 1}`;
    const processedAvatar = getAvatarUrl(avatar, defaultName);
    console.log(`Processed avatar ${index}:`, avatar, '->', processedAvatar);
    return processedAvatar;
  });
  
  // 取前4个成员的头像
  const avatars = processedAvatars.slice(0, 4);
  console.log('Final avatars for grid:', avatars);

  // 如果只有一个成员，直接返回该成员头像
  if (avatars.length === 1) {
    console.log('Single avatar, returning directly:', avatars[0]);
    return avatars[0];
  }

  // 创建SVG九宫格头像
  const svgWidth = 100;
  const svgHeight = 100;
  const halfWidth = svgWidth / 2;
  const halfHeight = svgHeight / 2;

  let svgContent = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">`;
  
  switch (avatars.length) {
    case 2:
      // 左右分半
      console.log('Generating 2-avatar grid layout');
      svgContent += `<defs>
        <clipPath id="clipLeft">
          <rect x="0" y="0" width="${halfWidth}" height="${svgHeight}" />
        </clipPath>
        <clipPath id="clipRight">
          <rect x="${halfWidth}" y="0" width="${halfWidth}" height="${svgHeight}" />
        </clipPath>
      </defs>`;
      svgContent += `<image href="${avatars[0]}" x="0" y="0" width="${svgWidth}" height="${svgHeight}" clip-path="url(#clipLeft)" />`;
      svgContent += `<image href="${avatars[1]}" x="0" y="0" width="${svgWidth}" height="${svgHeight}" clip-path="url(#clipRight)" />`;
      break;
      
    case 3:
      // 上面一个完整，下面左右分半
      console.log('Generating 3-avatar grid layout');
      svgContent += `<defs>
        <clipPath id="clipTop">
          <rect x="0" y="0" width="${svgWidth}" height="${halfHeight}" />
        </clipPath>
        <clipPath id="clipBottomLeft">
          <rect x="0" y="${halfHeight}" width="${halfWidth}" height="${halfHeight}" />
        </clipPath>
        <clipPath id="clipBottomRight">
          <rect x="${halfWidth}" y="${halfHeight}" width="${halfWidth}" height="${halfHeight}" />
        </clipPath>
      </defs>`;
      svgContent += `<image href="${avatars[0]}" x="0" y="0" width="${svgWidth}" height="${svgHeight}" clip-path="url(#clipTop)" />`;
      svgContent += `<image href="${avatars[1]}" x="0" y="0" width="${svgWidth}" height="${svgHeight}" clip-path="url(#clipBottomLeft)" />`;
      svgContent += `<image href="${avatars[2]}" x="0" y="0" width="${svgWidth}" height="${svgHeight}" clip-path="url(#clipBottomRight)" />`;
      break;
      
    case 4:
      // 四宫格
      console.log('Generating 4-avatar grid layout');
      svgContent += `<defs>
        <clipPath id="clipTopLeft">
          <rect x="0" y="0" width="${halfWidth}" height="${halfHeight}" />
        </clipPath>
        <clipPath id="clipTopRight">
          <rect x="${halfWidth}" y="0" width="${halfWidth}" height="${halfHeight}" />
        </clipPath>
        <clipPath id="clipBottomLeft">
          <rect x="0" y="${halfHeight}" width="${halfWidth}" height="${halfHeight}" />
        </clipPath>
        <clipPath id="clipBottomRight">
          <rect x="${halfWidth}" y="${halfHeight}" width="${halfWidth}" height="${halfHeight}" />
        </clipPath>
      </defs>`;
      svgContent += `<image href="${avatars[0]}" x="0" y="0" width="${svgWidth}" height="${svgHeight}" clip-path="url(#clipTopLeft)" />`;
      svgContent += `<image href="${avatars[1]}" x="0" y="0" width="${svgWidth}" height="${svgHeight}" clip-path="url(#clipTopRight)" />`;
      svgContent += `<image href="${avatars[2]}" x="0" y="0" width="${svgWidth}" height="${svgHeight}" clip-path="url(#clipBottomLeft)" />`;
      svgContent += `<image href="${avatars[3]}" x="0" y="0" width="${svgWidth}" height="${svgHeight}" clip-path="url(#clipBottomRight)" />`;
      break;
  }
  
  svgContent += '</svg>';
  
  // 返回base64编码的SVG
  const result = `data:image/svg+xml;base64,${btoa(svgContent)}`;
  console.log('Generated group avatar:', result);
  return result;
}

// 监听房间变化
watch(() => props.room, async (newRoom) => {
  if (newRoom) {
    await loadRoomInfo()
    await loadMembers()
  }
})

// 组件挂载时加载数据
onMounted(async () => {
  await loadRoomInfo()
  await loadMembers()
  await loadAvailableFriends()
})
</script>

<template>
  <div class="room-detail-panel">
    <div class="panel-header">
      <h3>房间信息</h3>
      <Button icon="pi pi-times" @click="$emit('back')" class="p-button-text p-button-sm close-btn" rounded text />
    </div>

    <div class="room-info-section">
      <div class="room-basic-info">
        <img :src="getAvatarUrl(room?.avatar, room?.name)" :alt="room?.name || 'Room Avatar'" class="room-avatar" />
        <div class="room-text">
          <div class="room-name">{{ room?.name || 'Unnamed Room' }}</div>
          <div class="room-id">ID: {{ room?.roomId }}</div>
        </div>
      </div>

    </div>

    <div class="members-section">
      <div class="section-header">
        <h4>成员 ({{ members.length }})</h4>
        <Button v-if="roomInfo && isRoomOwner(roomInfo) && !showAddMemberForm" icon="pi pi-user-plus" @click="showAddMemberForm = true"
          class="p-button-text p-button-sm" />
      </div>

      <div v-if="loadingMembers" class="loading">加载成员中...</div>
      <div v-else class="members-list">
        <div v-for="member in members" :key="member.userId" class="member-item">
          <img :src="getAvatarUrl(member.avatar, member.name)" :alt="member.name || 'Member Avatar'"
            class="member-avatar" />
          <div class="member-text">
            <div class="member-name">{{ member.name }}</div>
            <div class="member-account" v-if="member.userId">@{{ member.userId }}</div>
          </div>
          <div class="member-role">
            <span v-if="member.identity === MemberInfoIdentityEnum.Owner" class="role-tag owner">群主</span>
            <span v-else-if="member.identity === MemberInfoIdentityEnum.Admin" class="role-tag admin">管理员</span>
            <span v-else class="role-tag member">成员</span>
          </div>
          <div class="member-actions">
            <!-- 群主可以移除成员 -->
            <Button v-if="roomInfo && isRoomOwner(roomInfo) && member.identity !== MemberInfoIdentityEnum.Owner" icon="pi pi-trash"
              @click="removeMember(member.userId)" class="p-button-text p-button-sm p-button-danger" rounded text />
          </div>
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
              <img :src="getAvatarUrl(friend.avatar, friend.name || friend.account)"
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
}

.panel-header h3 {
  margin: 0;
  flex: 1;
  text-align: center;
  color: #2c3e50;
}

.close-btn {
  color: #7f8c8d;
}

.spacer {
  width: 32px; /* 与返回按钮宽度相同，用于居中标题 */
}

.room-info-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
  border-bottom: 1px solid #e1e8ed;
}

.room-avatar-container {
  margin-bottom: 1rem;
}

.room-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #f1f8ff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.room-name {
  font-size: 1.5rem;
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
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h4 {
  margin: 0;
  color: #2c3e50;
  flex: 1;
}

.member-count {
  color: #7f8c8d;
  margin-right: 0.5rem;
}

.invite-btn {
  margin-left: 0.5rem;
}

.members-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.member-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-radius: 8px;
  background-color: #f8f9fa;
  transition: background-color 0.2s;
}

.member-item:hover {
  background-color: #f1f8ff;
}

.member-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 1rem;
  object-fit: cover;
}

.member-text {
  flex: 1;
}

.member-name {
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.member-account {
  font-size: 0.875rem;
  color: #7f8c8d;
}

.member-role {
  margin-left: 1rem;
}

.role-tag {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
}

.role-tag.owner {
  background-color: #3498db;
  color: white;
}

.role-tag.admin {
  background-color: #e67e22;
  color: white;
}

.role-tag.member {
  background-color: #bdc3c7;
  color: #2c3e50;
}

.member-actions {
  margin-left: 1rem;
}

.loading {
  padding: 2rem;
  text-align: center;
  color: #7f8c8d;
}

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