<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { RoomClient } from '../../api'
import { Result } from '../../api/types/response/base/Result'
import { RoomSimpleInfo } from '../../api/types/base/RoomSimpleInfo'
import { generateNicknameAvatar } from '../../utils/avatarUtils'
import { CursorReq } from '../../api/types/request/CursorReq'

// 定义props
const props = defineProps<{
  selectedRoom?: RoomSimpleInfo | null
}>()

// 定义事件
const emit = defineEmits<{
  (e: 'select-room', room: RoomSimpleInfo): void
  (e: 'open-room-details', room: RoomSimpleInfo): void
}>()

// 定义暴露给父组件的方法
defineExpose({
  initRooms,
  updateRoomUnreadCount,
  updateRoomLastMessage
})

// 初始化依赖
const toast = useToast()

// 状态管理
const rooms = ref<RoomSimpleInfo[]>([]) // 房间列表
const loadingRooms = ref(true) // 加载状态

// 生命周期钩子
onMounted(async () => {
  await initRooms()
})

// 监听selectedRoom变化，确保内部状态同步
watch(() => props.selectedRoom, (newRoom) => {
  // 当父组件的selectedRoom变化时，确保房间列表中包含该房间
  if (newRoom && !rooms.value.some(room => room.roomId === newRoom.roomId)) {
    // 如果房间列表中没有该房间，则添加到列表中
    rooms.value.unshift(newRoom)
  }
})

// 更新房间未读消息数
function updateRoomUnreadCount(roomId: string, unreadCount: number) {
  const room = rooms.value.find(r => r.roomId === roomId)
  if (room) {
    // 如果是增加未读消息数
    if (unreadCount > 0) {
      room.unread = (room.unread || 0) + unreadCount
    } 
    // 如果是重置未读消息数
    else if (unreadCount === 0) {
      room.unread = 0
    }
    // 其他情况（如负数）不做处理，避免异常值影响
  }
}

// 更新房间最后消息
function updateRoomLastMessage(roomId: string, lastMessage: string, lastMessageTime?: number) {
  const room = rooms.value.find(r => r.roomId === roomId)
  if (room) {
    if (!room.lastMsgInfo) {
      room.lastMsgInfo = {}
    }
    room.lastMsgInfo.content = lastMessage
    if (lastMessageTime) {
      room.lastMsgInfo.time = lastMessageTime
    }
  }
}

// 初始化房间列表
async function initRooms() {
  try {
    loadingRooms.value = true
    
    // 构造请求参数
    const cursorReq = new CursorReq()
    cursorReq.cursor = undefined
    cursorReq.size = 100
    
    // 获取房间列表
    const response = await RoomClient.roomList(cursorReq)
    const result = new Result(response)
    
    if (result.isSuccess()) {
      // 更新房间列表
      rooms.value = result.data?.data || []
      
      // 如果父组件传递了选中的房间，确保它在列表中
      if (props.selectedRoom && !rooms.value.some(room => room.roomId === props.selectedRoom?.roomId)) {
        rooms.value.unshift(props.selectedRoom)
      }
      
      // 默认选中第一个房间（仅在没有已选房间时）
      if (!props.selectedRoom && rooms.value.length > 0) {
        emit('select-room', rooms.value[0])
      }
    } else {
      // 显示错误提示
      toast.add({
        severity: 'error',
        summary: '错误',
        detail: result.message || '获取房间列表失败',
        life: 3000
      })
    }
  } catch (error: any) {
    // 异常处理
    console.error('获取房间列表异常:', error)
    toast.add({
      severity: 'error',
      summary: '错误',
      detail: error.message || '获取房间列表异常',
      life: 3000
    })
  } finally {
    // 更新加载状态
    loadingRooms.value = false
  }
}

// 选择房间
const selectRoom = (room: RoomSimpleInfo) => {
  emit('select-room', room)
}

// 格式化时间戳为可读时间
const formatTime = (timestamp: number | undefined) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// 打开房间详情
const openRoomDetails = (room: RoomSimpleInfo) => {
  emit('open-room-details', room)
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

</script>

<template>
  <div class="chats-section">
    <div v-if="loadingRooms" class="loading">Loading chats...</div>
    <div v-else class="rooms-list">
      <div v-for="room in rooms" :key="room.roomId" @click="selectRoom(room)"
        :class="['room-item', { active: selectedRoom?.roomId === room.roomId }]">
        <img :src="getAvatarUrl(room.avatar, room.name)" :alt="room.name || 'Room Avatar'"
          class="room-avatar" />
        <div class="room-details">
          <div class="room-name">{{ room.name || 'Unnamed Room' }}</div>
          <div class="room-last-message">
            {{ room.lastMsgInfo?.content || 'No messages yet' }}
          </div>
        </div>
        <div class="room-meta">
          <div class="room-time" v-if="room.lastMsgInfo?.time">
            {{ formatTime(room.lastMsgInfo.time) }}
          </div>
          <div class="room-unread" v-if="room.unread && room.unread > 0">
            {{ room.unread }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chats-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.rooms-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.room-container {
  position: relative;
  display: flex;
  align-items: center;
  padding: 14px 20px;
  cursor: pointer;
  border-bottom: 1px solid #f1f5f8;
  transition: all 0.3s ease;
}

.room-item {
  display: flex;
  align-items: center;
  flex: 1;
}

.room-item:hover {
  background-color: #f0f8ff;
  transform: translateX(3px);
}

.room-item.active {
  background-color: #e1f0fa;
  border-left: 4px solid #3498db;
}

.room-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  margin-right: 15px;
  object-fit: cover;
  border: 2px solid #fff;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.room-details {
  flex: 1;
  min-width: 0;
}

.room-name {
  font-weight: 600;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 16px;
  color: #2c3e50;
}

.room-last-message {
  font-size: 14px;
  color: #7f8c8d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.room-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.room-time {
  font-size: 12px;
  color: #95a5a6;
  margin-bottom: 6px;
}

.room-unread {
  background-color: #e74c3c;
  color: white;
  font-size: 12px;
  font-weight: bold;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading {
  padding: 20px;
  text-align: center;
  color: #7f8c8d;
}
</style>