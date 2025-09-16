<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { MsgClient, RoomClient } from '../../api'
import { RoomSimpleInfo, RoomSimpleInfoRoomTypeEnum } from '../../api/types/base/RoomSimpleInfo'
import { ChatMsgVo } from '../../api/types/response/ChatMsgVo'
import { ChatCommendReq, ChatCommendReqRoomTypeEnum, ChatCommendReqMsgTypeEnum } from '../../api/types/request/ChatCommendReq'
import { CursorReq } from '../../api/types/request/CursorReq'
import { ChatMsgPollReq, ChatMsgPollReqRoomTypeEnum } from '../../api/types/request/ChatMsgPollReq'
import { RoomMsgReadReq } from '../../api/types/request/RoomMsgReadReq'
import { Result } from '../../api/types/response/base/Result'

const props = defineProps<{
  selectedRoom: RoomSimpleInfo | null
}>()

const toast = useToast()

// Messages data
const messages = ref<ChatMsgVo[]>([])
const loadingMessages = ref(false)
const messageContent = ref('')
const hasMoreMessages = ref(true) // 是否还有更多历史消息
const currentCursor = ref<string | undefined>(undefined) // 当前游标

// Polling variables
const pollingInterval = ref<number | null>(null)
const lastPollTimestamps = ref<Map<string, number>>(new Map())

// 监听选中房间变化
watch(() => props.selectedRoom, (newRoom, oldRoom) => {
  if (newRoom && newRoom.roomId !== oldRoom?.roomId) {
    selectRoom(newRoom)
  }
}, { immediate: true })

defineExpose({
  messages,
  loadingMessages,
  messageContent,
  hasMoreMessages,
  currentCursor,
  pollingInterval,
  lastPollTimestamps
})

// 页面加载时启动轮询（与WebSocket并行工作）
onMounted(() => {
  startPolling()
})

// 页面卸载时停止轮询
onUnmounted(() => {
  stopPolling()
})

// 选择房间并加载消息
const selectRoom = async (room: RoomSimpleInfo) => {
  // 重置未读消息数
  resetUnreadCount(room)
  await loadMessages(room)

  // 上报已读消息
  if (messages.value.length > 0) {
    const lastMessage = messages.value[messages.value.length - 1]
    await markMessageAsRead(room.roomId!, lastMessage.msgId!)
  }

  // 在下次DOM更新后滚动到消息底部（最新消息）
  nextTick(() => {
    const messagesArea = document.querySelector('.messages-area')
    if (messagesArea) {
      messagesArea.scrollTop = messagesArea.scrollHeight
    }
  })
}

// 重置房间未读消息数
const resetUnreadCount = (room: RoomSimpleInfo) => {
  // 这里应该通知父组件更新房间未读数
  // 实际实现中需要通过事件或状态管理来完成
}

// 加载房间消息
const loadMessages = async (room: RoomSimpleInfo, cursor?: string) => {
  if (!room.roomId) return

  try {
    // 如果是首次加载（没有提供cursor），则显示loading状态
    if (!cursor) {
      loadingMessages.value = true
      // 重置游标和消息列表
      currentCursor.value = undefined
      messages.value = []
      hasMoreMessages.value = true
    }

    const cursorReq: CursorReq = {
      roomId: room.roomId,
      cursor: cursor, // 使用传入的游标，首次加载时为undefined
      size: 20 // 正数表示向后查询最新消息
    }
    const response = await RoomClient.roomMsgList(cursorReq)
    const result = new Result(response)
    if (result.isSuccess()) {
      const newMessages = result.data?.data || []

      if (newMessages.length > 0) {
        // 更新当前游标
        currentCursor.value = result.data?.cursor

        // 过滤掉已经存在的消息，避免重复
        const uniqueNewMessages = newMessages.filter(
          newMsg => !messages.value.some(existingMsg => existingMsg.msgId === newMsg.msgId)
        )

        if (!cursor) {
          // 首次加载，直接显示最新消息
          messages.value = [...uniqueNewMessages]
        } else if (uniqueNewMessages.length > 0) {
          // 加载更多历史消息，添加到消息列表开头
          messages.value = [...uniqueNewMessages, ...messages.value]
        }

        // 按msgSeq从小到大排序
        messages.value.sort((a, b) => {
          const seqA = a.msgSeq || 0
          const seqB = b.msgSeq || 0
          return seqA - seqB
        })

        // 如果返回的消息少于请求数量，说明没有更多历史消息了
        if (newMessages.length < 20) {
          hasMoreMessages.value = false
        }
      } else {
        // 没有更多消息了
        hasMoreMessages.value = false
      }

      // 更新该房间的最后拉取时间（仅在首次加载时）
      if (!cursor) {
        lastPollTimestamps.value.set(room.roomId, Date.now())
      }
    } else {
      toast.add({ severity: 'error', summary: '错误', detail: result.message || '获取消息失败', life: 3000 })
    }
  } catch (error: any) {
    toast.add({ severity: 'error', summary: '错误', detail: error.message || '获取消息失败', life: 3000 })
  } finally {
    if (!cursor) {
      loadingMessages.value = false
    }
  }
}

// 处理滚动事件，加载历史消息
const handleScroll = async (event: Event) => {
  const target = event.target as HTMLElement
  // 检查是否滚动到顶部附近（加载历史消息）
  if (target.scrollTop <= 100 && hasMoreMessages.value && !loadingMessages.value && props.selectedRoom) {
    // 加载更多历史消息
    await loadMoreHistoryMessages(props.selectedRoom, currentCursor.value)
  }
}

// 加载更多历史消息
const loadMoreHistoryMessages = async (room: RoomSimpleInfo, cursor?: string) => {
  if (!room.roomId) return

  try {
    const cursorReq: CursorReq = {
      roomId: room.roomId,
      cursor: cursor,
      size: -20 // 负数表示向前查询历史消息
    }
    const response = await RoomClient.roomMsgList(cursorReq)
    const result = new Result(response)
    if (result.isSuccess()) {
      const newMessages = result.data?.data || []

      if (newMessages.length > 0) {
        // 更新当前游标
        currentCursor.value = result.data?.cursor

        // 过滤掉已经存在的消息，避免重复
        const uniqueNewMessages = newMessages.filter(
          newMsg => !messages.value.some(existingMsg => existingMsg.msgId === newMsg.msgId)
        )

        if (uniqueNewMessages.length > 0) {
          // 加载历史消息，添加到消息列表开头
          messages.value = [...uniqueNewMessages, ...messages.value]
        }

        // 按msgSeq从小到大排序
        messages.value.sort((a, b) => {
          const seqA = a.msgSeq || 0
          const seqB = b.msgSeq || 0
          return seqA - seqB
        })

        // 如果返回的消息少于请求数量，说明没有更多历史消息了
        if (newMessages.length < 20) {
          hasMoreMessages.value = false
        }
      } else {
        // 没有更多消息了
        hasMoreMessages.value = false
      }
      
      // 更新该房间的最后拉取时间
      lastPollTimestamps.value.set(room.roomId, Date.now())
    } else {
      toast.add({ severity: 'error', summary: '错误', detail: result.message || '获取历史消息失败', life: 3000 })
    }
  } catch (error: any) {
    toast.add({ severity: 'error', summary: '错误', detail: error.message || '获取历史消息失败', life: 3000 })
  }
}

// 发送消息
const sendMessage = async () => {
  if (!messageContent.value.trim() || !props.selectedRoom?.roomId) {
    return
  }

  try {
    const roomType = props.selectedRoom.roomType === RoomSimpleInfoRoomTypeEnum.Group
      ? ChatCommendReqRoomTypeEnum.Group
      : ChatCommendReqRoomTypeEnum.Single;

    const req: ChatCommendReq = {
      roomType: roomType,
      msgType: ChatCommendReqMsgTypeEnum.Text,
      roomId: props.selectedRoom.roomId,
      random: Math.random().toString(36).substring(2, 15),
      content: messageContent.value
    }

    const response = await MsgClient.sendMsg(req)
    const result = new Result(response)
    if (result.isSuccess()) {
      // 清空输入框
      messageContent.value = ''
      // 重新加载消息以显示新消息
      if (props.selectedRoom) {
        await loadMessages(props.selectedRoom)
      }
    } else {
      toast.add({ severity: 'error', summary: '错误', detail: result.message || '发送消息失败', life: 3000 })
    }
  } catch (error: any) {
    toast.add({ severity: 'error', summary: '错误', detail: error.message || '发送消息失败', life: 3000 })
  }
}

// 格式化时间戳为可读时间
const formatTime = (timestamp: number | undefined) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// 启动轮询（与WebSocket并行工作）
const startPolling = () => {
  // 每5秒轮询一次，与WebSocket并行工作以确保即时性
  pollingInterval.value = window.setInterval(async () => {
    await pollMessages()
  }, 5000)
}

// 停止轮询
const stopPolling = () => {
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value)
    pollingInterval.value = null
  }
}

// 轮询消息
const pollMessages = async () => {
  // 这里应该实现轮询逻辑
  // 由于这是一个简化版本，我们暂时留空
}

// 上报消息已读
const markMessageAsRead = async (roomId: string, msgId: string) => {
  try {
    const req = new RoomMsgReadReq()
    req.roomId = roomId
    req.msgId = msgId
    const response = await RoomClient.readMsg(req)
    const result = new Result(response)
    if (!result.isSuccess()) {
      console.warn('消息已读上报失败:', result.message)
    }
  } catch (error) {
    console.warn('消息已读上报异常:', error)
  }
}
</script>

<template>
  <div class="right-panel">
    <div v-if="!props.selectedRoom" class="no-room-selected">
      <div class="welcome-content">
        <div class="welcome-icon">
          <i class="pi pi-comments"></i>
        </div>
        <h2>Welcome to Mini Chat</h2>
        <p>Select a chat to start messaging</p>
      </div>
    </div>
    <div v-else class="chat-container">
      <!-- Chat Header -->
      <div class="chat-header">
        <img :src="props.selectedRoom.avatar || 'https://www.gravatar.com/avatar?d=mp'"
          :alt="props.selectedRoom.name || 'Room Avatar'" class="room-avatar" />
        <div class="room-info">
          <div class="room-name">{{ props.selectedRoom.name || 'Unnamed Room' }}</div>
          <div class="room-status">Online</div>
        </div>
        <div class="chat-actions">
          <Button icon="pi pi-phone" class="p-button-text p-button-sm" rounded text />
          <Button icon="pi pi-video" class="p-button-text p-button-sm" rounded text />
          <Button icon="pi pi-ellipsis-v" class="p-button-text p-button-sm" rounded text />
        </div>
      </div>

      <!-- Messages Area -->
      <div class="messages-area" @scroll="handleScroll">
        <div v-if="loadingMessages" class="loading">Loading messages...</div>
        <div v-else class="messages-list">
          <div v-for="message in messages" :key="message.msgId"
            :class="['message', { sent: message.self, received: !message.self }]">
            <div class="message-content">
              <div class="message-text">{{ message.content }}</div>
              <div class="message-time">{{ formatTime(message.serverTime) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Message Input -->
      <div class="message-input-area">
        <div class="input-container">
          <Button icon="pi pi-plus" class="p-button-text attachment-button" rounded text />
          <InputText v-model="messageContent" placeholder="Type a message..." @keyup.enter="sendMessage"
            class="message-input" />
          <Button icon="pi pi-send" @click="sendMessage" :disabled="!messageContent.trim()" class="send-button"
            rounded text />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: linear-gradient(to bottom, #ffffff, #f9fbfd);
  position: relative;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.03);
}

.no-room-selected {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
}

.welcome-content {
  text-align: center;
  color: #7f8c8d;
}

.welcome-icon {
  font-size: 72px;
  margin-bottom: 25px;
  color: #3498db;
  width: 140px;
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  margin: 0 auto 25px;
  box-shadow: 0 8px 20px rgba(52, 152, 219, 0.2);
}

.welcome-content h2 {
  margin-bottom: 15px;
  color: #2c3e50;
  font-weight: 600;
  font-size: 28px;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-header {
  display: flex;
  align-items: center;
  padding: 15px 25px;
  border-bottom: 1px solid #e1e8ed;
  background: linear-gradient(to right, #ffffff, #f8f9fa);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.03);
}

.chat-header .room-avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  margin-right: 18px;
  object-fit: cover;
  border: 2px solid #fff;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.room-info {
  flex: 1;
}

.room-info .room-name {
  font-weight: 600;
  font-size: 18px;
  color: #2c3e50;
}

.room-info .room-status {
  font-size: 14px;
  color: #27ae60;
  font-weight: 500;
}

.chat-actions {
  display: flex;
  gap: 8px;
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 25px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
  display: flex;
  flex-direction: column;
}

.messages-list {
  display: flex;
  flex-direction: column;
}

.message {
  display: flex;
  margin-bottom: 20px;
  max-width: 75%;
}

.message.received {
  align-self: flex-start;
}

.message.sent {
  align-self: flex-end;
  margin-left: auto;
}

.message-content {
  padding: 12px 18px;
  border-radius: 20px;
  position: relative;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.message.received .message-content {
  background: linear-gradient(to bottom, #ffffff, #f8f9fa);
  border: 1px solid #e1e8ed;
  border-top-left-radius: 5px;
  color: #34495e;
}

.message.sent .message-content {
  background: linear-gradient(to bottom, #3498db, #2c3e50);
  color: white;
  border-top-right-radius: 5px;
}

.message-text {
  margin-bottom: 6px;
  word-wrap: break-word;
  font-size: 16px;
}

.message-time {
  font-size: 12px;
  text-align: right;
}

.message.sent .message-time {
  color: rgba(255, 255, 255, 0.8);
}

.message.received .message-time {
  color: #95a5a6;
}

.message-input-area {
  padding: 20px;
  border-top: 1px solid #e1e8ed;
  background: linear-gradient(to bottom, #ffffff, #f8f9fa);
}

.input-container {
  display: flex;
  align-items: center;
  background-color: #f0f8ff;
  border-radius: 30px;
  padding: 8px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.attachment-button {
  margin-right: 10px;
  width: 40px;
  height: 40px;
  color: #3498db;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.attachment-button:hover {
  background-color: #e1f0fa;
  transform: rotate(10deg);
}

.message-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 12px 0;
  outline: none;
  font-size: 16px;
  color: #2c3e50;
}

.send-button {
  width: 40px;
  height: 40px;
  color: #3498db;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.send-button:hover {
  background-color: #e1f0fa;
  transform: scale(1.1);
}

.send-button:disabled {
  color: #bbdefb;
}

.loading {
  padding: 25px;
  text-align: center;
  color: #95a5a6;
  font-weight: 500;
}
</style>