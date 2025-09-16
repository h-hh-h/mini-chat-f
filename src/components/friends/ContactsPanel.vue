<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { FriendClient, RoomClient } from '../../api'
import { FriendInfo } from '../../api/types/base/FriendInfo'
import { SingleRoomQueryReq } from '../../api/types/request/SingleRoomQueryReq'
import { GroupCreateReq } from '../../api/types/request/GroupCreateReq'
import { GroupCompleteInfo } from '../../api/types/base/GroupCompleteInfo'
import { RoomSimpleInfo, RoomSimpleInfoRoomTypeEnum } from '../../api/types/base/RoomSimpleInfo'
import { Result } from '../../api/types/response/base/Result'

const emit = defineEmits<{
  (e: 'switch-section', section: 'chats' | 'contacts'): void
  (e: 'select-room', room: RoomSimpleInfo): void
}>()

// 暴露方法给父组件
const clearSelectedGroup = () => {
  selectedGroup.value = null;
}

defineExpose({
  clearSelectedGroup
})

const toast = useToast()

// Friends list
const friends = ref<FriendInfo[]>([])
const loadingFriends = ref(false)

// Groups list
const groups = ref<RoomSimpleInfo[]>([])
const loadingGroups = ref(false)

// 选中的群聊
const selectedGroup = ref<RoomSimpleInfo | null>(null)

// 创建群聊相关变量
const showCreateGroup = ref(false)
const groupName = ref('')
const groupDescription = ref('')
const selectedFriends = ref<Set<string>>(new Set())
const creatingGroup = ref(false)

// Check if we're in test mode (no authentication)
const isTestMode = window.location.hash.includes('im-test') || window.location.pathname.includes('im-test')

// 页面加载时初始化
onMounted(async () => {
  await loadFriends()
  await loadGroups()
})

// 加载好友列表
const loadFriends = async () => {
  try {
    loadingFriends.value = true

    if (isTestMode) {
      // 测试模式下模拟好友列表
      friends.value = [
        {
          userId: 'user-1',
          account: 'user1',
          name: 'User 1',
          avatar: 'https://www.gravatar.com/avatar?d=mp'
        },
        {
          userId: 'user-2',
          account: 'user2',
          name: 'User 2',
          avatar: 'https://www.gravatar.com/avatar?d=mp'
        }
      ]
      return
    }

    const response = await FriendClient.listFriend(1, 100)
    const result = new Result(response)
    if (result.isSuccess()) {
      friends.value = result.data?.records || []
    } else {
      toast.add({ severity: 'error', summary: '错误', detail: result.message || '获取好友列表失败', life: 3000 })
    }
  } catch (error: any) {
    if (isTestMode) {
      friends.value = [
        {
          userId: 'user-1',
          account: 'user1',
          name: 'User 1',
          avatar: 'https://www.gravatar.com/avatar?d=mp'
        }
      ]
    } else {
      toast.add({ severity: 'error', summary: '错误', detail: error.message || '获取好友列表失败', life: 3000 })
    }
  } finally {
    loadingFriends.value = false
  }
}

// 加载群聊列表
const loadGroups = async () => {
  try {
    loadingGroups.value = true

    if (isTestMode) {
      // 测试模式下模拟群聊列表
      groups.value = [
        {
          roomId: 'group-1',
          name: 'Group 1',
          roomType: RoomSimpleInfoRoomTypeEnum.Group,
          avatar: 'https://www.gravatar.com/avatar?d=mp'
        },
        {
          roomId: 'group-2',
          name: 'Group 2',
          roomType: RoomSimpleInfoRoomTypeEnum.Group,
          avatar: 'https://www.gravatar.com/avatar?d=mp'
        }
      ]
      return
    }

    // 获取房间列表
    const response = await RoomClient.roomList({ size: 100 })
    const result = new Result(response)
    
    if (result.isSuccess()) {
      // 过滤出群聊房间
      groups.value = (result.data?.data || []).filter(room => 
        room.roomType === RoomSimpleInfoRoomTypeEnum.Group
      )
    } else {
      toast.add({ severity: 'error', summary: '错误', detail: result.message || '获取群聊列表失败', life: 3000 })
    }
  } catch (error: any) {
    if (!isTestMode) {
      toast.add({ severity: 'error', summary: '错误', detail: error.message || '获取群聊列表失败', life: 3000 })
    }
  } finally {
    loadingGroups.value = false
  }
}

// 切换创建群聊面板显示状态
const toggleCreateGroup = () => {
  showCreateGroup.value = !showCreateGroup.value
  // 重置表单
  if (!showCreateGroup.value) {
    groupName.value = ''
    groupDescription.value = ''
    selectedFriends.value.clear()
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

// 将GroupCompleteInfo转换为RoomSimpleInfo
const convertGroupToRoomSimpleInfo = (groupInfo: GroupCompleteInfo): RoomSimpleInfo => {
  return {
    roomId: groupInfo.roomId,
    name: groupInfo.name,
    roomType: groupInfo.roomType as unknown as RoomSimpleInfoRoomTypeEnum,
    avatar: groupInfo.avatar,
    unread: groupInfo.unread,
    lastReadMsgId: groupInfo.lastReadMsgId,
    lastMsgInfo: groupInfo.lastMsgInfo
  }
}

// 创建群聊
const createGroup = async () => {
  if (!groupName.value.trim() || selectedFriends.value.size === 0) {
    toast.add({ severity: 'warn', summary: '警告', detail: '请填写群名称并至少选择一个好友', life: 3000 })
    return
  }

  try {
    creatingGroup.value = true

    // 构造请求参数
    const req = new GroupCreateReq()
    req.name = groupName.value
    req.description = groupDescription.value
    // @ts-ignore 由于API需要数组格式，这里将Set转换为数组
    req.memberIds = Array.from(selectedFriends.value)

    // 调用后端接口创建群聊
    const response = await RoomClient.createGroup(req)
    const result = new Result(response)

    if (result.isSuccess()) {
      const roomInfo = result.data
      if (roomInfo) {
        // 将新创建的群聊添加到房间列表顶部
        const roomSimpleInfo = convertGroupToRoomSimpleInfo(roomInfo)
        // 通过事件通知父组件添加房间，并切换到聊天板块
        emit('select-room', roomSimpleInfo)
        emit('switch-section', 'chats')
        
        // 关闭创建群聊面板
        toggleCreateGroup()
        
        // 重新加载群聊列表
        await loadGroups()
        
        toast.add({ severity: 'success', summary: '成功', detail: '群聊创建成功', life: 3000 })
      }
    } else {
      toast.add({ severity: 'error', summary: '错误', detail: result.message || '创建群聊失败', life: 3000 })
    }
  } catch (error: any) {
    console.error('创建群聊失败:', error)
    toast.add({ severity: 'error', summary: '错误', detail: error.message || '创建群聊失败', life: 3000 })
  } finally {
    creatingGroup.value = false
  }
}

// 点击好友打开私聊房间
const openPrivateChat = async (friend: FriendInfo) => {
  try {
    // 获取单聊房间信息
    const req = new SingleRoomQueryReq();
    req.friendId = friend.userId || '';

    const response = await RoomClient.querySingleRoom(req);
    const result = new Result(response);

    if (result.isSuccess()) {
      const roomInfo = result.data;
      if (roomInfo) {
        // 通知父组件选择房间
        emit('select-room', roomInfo);
        // 切换到聊天板块
        emit('switch-section', 'chats');
      }
    } else {
      toast.add({ severity: 'error', summary: '错误', detail: result.message || '获取房间信息失败', life: 3000 });
    }
  } catch (error: any) {
    console.error('打开私聊房间失败:', error);
    toast.add({ severity: 'error', summary: '错误', detail: error.message || '打开私聊房间失败', life: 3000 });
  }
}

// 点击群聊打开群聊房间
const openGroupChat = (group: RoomSimpleInfo) => {
  // 设置选中的群聊
  selectedGroup.value = group;
  
  // 通知父组件选择房间
  emit('select-room', group);
  // 切换到聊天板块
  emit('switch-section', 'chats');
}
</script>

<template>
  <div class="contacts-section">
    <div class="contacts-header">
      <div class="contacts-actions">
        <Button icon="pi pi-users" label="创建群聊" @click="toggleCreateGroup" class="p-button-sm p-button-outlined"
          size="small" />
      </div>
    </div>

    <div v-if="showCreateGroup" class="create-group-panel">
      <div class="panel-header">
        <h3>创建群聊</h3>
        <Button icon="pi pi-times" @click="toggleCreateGroup" class="p-button-text p-button-sm close-btn"
          rounded text />
      </div>

      <div class="create-group-content">
        <div class="form-group">
          <label for="groupName">群名称 *</label>
          <InputText id="groupName" v-model="groupName" placeholder="请输入群名称" maxlength="20" />
        </div>

        <div class="form-group">
          <label for="groupDescription">群描述</label>
          <Textarea id="groupDescription" v-model="groupDescription" placeholder="请输入群描述" rows="3"
            maxlength="100" />
        </div>

        <div class="form-group">
          <label>选择好友 *</label>
          <div class="friends-selection">
            <div v-for="friend in friends" :key="friend.userId" class="friend-selection-item"
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

            <div v-if="friends.length === 0" class="no-friends">
              暂无好友
            </div>
          </div>
        </div>

        <div class="form-actions">
          <Button label="取消" @click="toggleCreateGroup" class="p-button-text" />
          <Button label="创建" @click="createGroup" :loading="creatingGroup"
            :disabled="!groupName.trim() || selectedFriends.size === 0" class="p-button-success" />
        </div>
      </div>
    </div>

    <div v-else>
      <div v-if="loadingFriends" class="loading">Loading friends...</div>
      <div v-else class="contacts-list">
        <div class="list-section">
          <h3 class="list-title">好友</h3>
          <div class="friends-list">
            <div v-for="friend in friends" :key="friend.userId" class="friend-item"
              @click="openPrivateChat(friend)">
              <img :src="friend.avatar || 'https://www.gravatar.com/avatar?d=mp'"
                :alt="friend.name || 'Friend Avatar'" class="friend-avatar" />
              <div class="friend-details">
                <div class="friend-name">{{ friend.name || friend.account }}</div>
                <div class="friend-account">@{{ friend.account }}</div>
              </div>
            </div>

            <div v-if="friends.length === 0" class="no-friends">
              No friends yet
            </div>
          </div>
        </div>

        <div class="list-section">
          <h3 class="list-title">群聊</h3>
          <div v-if="loadingGroups" class="loading">Loading groups...</div>
          <div v-else class="groups-list">
            <div v-for="group in groups" :key="group.roomId" class="group-item"
              :class="{ active: selectedGroup?.roomId === group.roomId }"
              @click="openGroupChat(group)">
              <img :src="group.avatar || 'https://www.gravatar.com/avatar?d=mp'"
                :alt="group.name || 'Group Avatar'" class="group-avatar" />
              <div class="group-details">
                <div class="group-name">{{ group.name || 'Unnamed Group' }}</div>
              </div>
            </div>

              <div v-if="groups.length === 0" class="no-groups">
                No groups yet
              </div>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.contacts-section {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #fafcff;
}

.contacts-header {
  padding: 1rem;
  border-bottom: 1px solid #e1e8ed;
  background-color: #f8f9fa;
}

.contacts-actions {
  display: flex;
  justify-content: flex-end;
}

.create-group-panel {
  padding: 1rem;
  background-color: #fff;
  border-bottom: 1px solid #e1e8ed;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.panel-header h3 {
  margin: 0;
  color: #2c3e50;
}

.close-btn {
  color: #7f8c8d;
}

.create-group-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #34495e;
}

.form-group .p-inputtext,
.form-group .p-textarea {
  width: 100%;
}

.friends-selection {
  max-height: 200px;
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

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}

.contacts-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.list-section {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f1f1;
}

.list-title {
  margin: 0 0 0.75rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
  color: #2c3e50;
  font-size: 1rem;
  font-weight: 600;
}

.friends-list,
.groups-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.friend-item,
.group-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
  margin-bottom: 0.25rem;
}

.friend-item:hover,
.group-item:hover {
  background-color: #f1f8ff;
}

.friend-item .friend-avatar,
.group-item .group-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 0.75rem;
}

.friend-details,
.group-details {
  flex: 1;
}

.friend-name,
.group-name {
  font-weight: 500;
  color: #2c3e50;
}

.friend-account {
  font-size: 0.8rem;
  color: #7f8c8d;
}

.loading {
  padding: 1rem;
  text-align: center;
  color: #7f8c8d;
}

.no-friends,
.no-groups {
  padding: 1rem;
  text-align: center;
  color: #7f8c8d;
  font-style: italic;
}
</style>