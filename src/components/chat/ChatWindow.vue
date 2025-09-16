<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { MsgClient, RoomClient } from '../../api'
interface ExtendedRoomSimpleInfo extends RoomSimpleInfo {
  lastMessage?: string
  lastMessageTime?: number
}

import { RoomSimpleInfo, RoomSimpleInfoRoomTypeEnum } from '../../api/types/base/RoomSimpleInfo'
import { ChatMsgVo } from '../../api/types/response/ChatMsgVo'
import { ChatCommendReq, ChatCommendReqRoomTypeEnum, ChatCommendReqMsgTypeEnum } from '../../api/types/request/ChatCommendReq'
import { CursorReq } from '../../api/types/request/CursorReq'
import { ChatMsgPollReq, ChatMsgPollReqRoomTypeEnum } from '../../api/types/request/ChatMsgPollReq'
import { RoomMsgReadReq } from '../../api/types/request/RoomMsgReadReq'
import { Result } from '../../api/types/response/base/Result'

const props = defineProps<{
  selectedRoom: ExtendedRoomSimpleInfo | null
}>()

const emit = defineEmits<{
  (e: 'message-sent', roomId: string, message: ChatMsgVo): void,
  (e: 'unread-update', roomId: string, unreadCount: number): void,
  (e: 'last-message-update', roomId: string, lastMessage: string, lastMessageTime?: number): void
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

// 发送中的消息ID映射（仅用于UI显示）
const sendingMessages = ref<Map<string, { 
  content: string, 
  timestamp: number,
  retries: number,
  maxRetries: number,
  status: 'sending' | 'sent' | 'failed'
}>>(new Map())

// 新消息浮标相关
const showNewMessageBadge = ref(false)
const newMessageCount = ref(0)
const newMessagesBuffer = ref<ChatMsgVo[]>([])

// 未读消息游标相关
const showUnreadCursor = ref(false)
const unreadMessageCount = ref(0)

// 监听选中房间变化
watch(() => props.selectedRoom, (newRoom, oldRoom) => {
  if (newRoom && newRoom.roomId !== oldRoom?.roomId) {
    // 切换房间时重置新消息浮标
    showNewMessageBadge.value = false
    newMessageCount.value = 0
    newMessagesBuffer.value = []
    
    // 切换房间时重置未读消息游标
    showUnreadCursor.value = false
    unreadMessageCount.value = newRoom.unread || 0
    
    selectRoom(newRoom)
  }
}, { immediate: true })

// 处理新消息
const handleNewMessage = (message: ChatMsgVo) => {
  // 使用msgKey作为唯一标识进行去重
  const messageExists = messages.value.some(msg => msg.msgKey && msg.msgKey === message.msgKey)
  
  if (!messageExists) {
    // 如果是当前房间的消息
    if (props.selectedRoom && message.roomId === props.selectedRoom.roomId) {
      // 添加新消息到列表
      messages.value.push(message)
      
      // 按msgSeq排序
      messages.value.sort((a, b) => {
        const seqA = a.msgSeq || 0
        const seqB = b.msgSeq || 0
        return seqA - seqB
      })
      
      // 如果用户正在查看聊天窗口（滚动到底部附近），则自动滚动到底部
      nextTick(() => {
        const messagesArea = document.querySelector('.messages-area')
        if (messagesArea) {
          // 如果已经在底部或接近底部，则自动滚动到底部
          if (messagesArea.scrollHeight - messagesArea.scrollTop <= messagesArea.clientHeight + 100) {
            messagesArea.scrollTop = messagesArea.scrollHeight
          } else {
            // 否则显示新消息浮标
            showNewMessageBadge.value = true
            newMessageCount.value++
            
            // 如果当前房间有未读消息数，则显示未读消息游标
            if (props.selectedRoom?.unread && props.selectedRoom.unread > 0) {
              showUnreadCursor.value = true
              unreadMessageCount.value = props.selectedRoom.unread
            }
          }
        }
      })
      
      // 如果当前房间存在且有roomId，更新房间最后消息
      if (props.selectedRoom?.roomId) {
        emit('last-message-update', props.selectedRoom.roomId, message.content || '', message.serverTime)
      }
      
      // 如果是别人发的消息且当前在房间内，更新未读数
      if (!message.self) {
        emit('unread-update', message.roomId!, 1)
      }
      
      // 更新房间最后消息（无论消息是谁发送的）
      emit('last-message-update', message.roomId!, message.content || '', message.serverTime)
    } else {
      // 不是当前房间的消息，更新房间未读数（但自己发送的消息除外）
      if (message.roomId && !message.self) {
        emit('unread-update', message.roomId, 1)
      }
      
      // 更新房间最后消息（无论消息是谁发送的）
      emit('last-message-update', message.roomId!, message.content || '', message.serverTime)
    }
  } else {
    // 如果消息已存在，可能是临时消息被替换，更新消息内容
    const index = messages.value.findIndex(msg => msg.msgKey && msg.msgKey === message.msgKey)
    if (index !== -1) {
      messages.value[index] = { ...messages.value[index], ...message }
      
      // 重新排序
      messages.value.sort((a, b) => {
        const seqA = a.msgSeq || 0
        const seqB = b.msgSeq || 0
        return seqA - seqB
      })
    }
  }
}

defineExpose({
  messages,
  loadingMessages,
  messageContent,
  hasMoreMessages,
  currentCursor,
  pollingInterval,
  lastPollTimestamps,
  handleNewMessage
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
    if (lastMessage.msgId && room.roomId) {
      await markMessageAsRead(room.roomId, lastMessage.msgId)
    }
  }

  // 在下次DOM更新后滚动到上次已读消息位置
  nextTick(() => {
    const messagesArea = document.querySelector('.messages-area')
    if (messagesArea) {
      // 如果有未读消息，显示未读消息游标
      if (room.unread && room.unread > 0) {
        showUnreadCursor.value = true
        unreadMessageCount.value = room.unread
      } else {
        // 没有未读消息，滚动到消息底部（最新消息）
        messagesArea.scrollTop = messagesArea.scrollHeight
      }
    }
  })
}

// 重置房间未读消息数
const resetUnreadCount = (room: RoomSimpleInfo) => {
  // 通知父组件将该房间未读数重置为0
  if (room.roomId) {
    emit('unread-update', room.roomId, 0)
  }
}

// 加载房间消息
const loadMessages = async (room: RoomSimpleInfo, cursor?: string) => {
  if (!room.roomId) return

  try {
    // 如果是首次加载（没有提供cursor），则显示loading状态
    if (!cursor) {
      loadingMessages.value = true
      // 重置游标
      currentCursor.value = undefined
      hasMoreMessages.value = true
      // 但不清空消息列表，避免清除刚刚发送的消息
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

        // 过滤掉已经存在的消息，避免重复（使用msgKey进行去重）
        const uniqueNewMessages = newMessages.filter(
          newMsg => !messages.value.some(existingMsg => 
            (newMsg.msgKey && existingMsg.msgKey && existingMsg.msgKey === newMsg.msgKey)
          )
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
      if (!cursor && room.roomId) {
        lastPollTimestamps.value.set(room.roomId, Date.now())
      }
    } else {
      toast.add({ severity: 'error', summary: '错误', detail: result.message || '获取消息失败', life: 3000 })
    }
  } catch (error: any) {
    console.error('加载消息失败:', error)
    toast.add({ severity: 'error', summary: '错误', detail: '加载消息失败', life: 3000 })
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
  
  // 检查是否滚动到底部，如果滚动到底部则隐藏新消息浮标
  if (target.scrollHeight - target.scrollTop <= target.clientHeight + 10) {
    showNewMessageBadge.value = false
    newMessageCount.value = 0
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

        // 过滤掉已经存在的消息，避免重复（使用msgKey进行去重）
        const uniqueNewMessages = newMessages.filter(
          newMsg => !messages.value.some(existingMsg => 
            (newMsg.msgKey && existingMsg.msgKey && existingMsg.msgKey === newMsg.msgKey)
          )
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
      if (room.roomId) {
        lastPollTimestamps.value.set(room.roomId, Date.now())
      }
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

  const content = messageContent.value.trim()
  const timestamp = Date.now()
  const tempMsgKey = `temp_${timestamp}_${Math.random().toString(36).substring(2, 15)}`
  const maxRetries = 3

  // 创建临时消息并添加到消息列表中
  const tempMessage: ChatMsgVo = {
    msgKey: tempMsgKey,
    content: content,
    self: true,
    serverTime: timestamp,
    roomId: props.selectedRoom.roomId
  }
  
  // 添加临时消息到消息列表
  messages.value.push(tempMessage)
  
  // 滚动到底部
  nextTick(() => {
    const messagesArea = document.querySelector('.messages-area')
    if (messagesArea) {
      messagesArea.scrollTop = messagesArea.scrollHeight
    }
  })

  // 添加到发送中消息集合
  sendingMessages.value.set(tempMsgKey, { 
    content, 
    timestamp, 
    retries: 0, 
    maxRetries,
    status: 'sending'
  })

  // 更新房间最后消息
  if (props.selectedRoom?.roomId) {
    emit('last-message-update', props.selectedRoom.roomId, content, timestamp)
  }

  // 清空输入框
  messageContent.value = ''

  try {
    // 发送消息并等待响应
    const result = await sendWithRetry(content, maxRetries)
    
    if (result.isSuccess() && result.data) {
      // 发送成功，更新临时消息为真实消息
      const realMessage: ChatMsgVo = {
        msgId: result.data.msgKey,
        msgKey: result.data.msgKey,
        roomId: props.selectedRoom!.roomId,
        content: content,
        self: true,
        serverTime: result.data.serverTime,
        senderId: result.data.senderId
      }
      
      // 替换临时消息为真实消息
      const index = messages.value.findIndex(msg => msg.msgKey === tempMsgKey)
      if (index !== -1) {
        messages.value[index] = realMessage
      }
      
      // 更新发送状态
      sendingMessages.value.set(tempMsgKey, { 
        content, 
        timestamp, 
        retries: 0, 
        maxRetries,
        status: 'sent'
      })
      
      // 更新房间最后消息
      if (props.selectedRoom!.roomId) {
        emit('last-message-update', props.selectedRoom!.roomId, content, result.data.serverTime)
      }
      
      if (props.selectedRoom!.roomId) {
        emit('message-sent', props.selectedRoom!.roomId, realMessage)
      }
    } else {
      // 发送失败，更新状态
      sendingMessages.value.set(tempMsgKey, { 
        content, 
        timestamp, 
        retries: maxRetries, 
        maxRetries,
        status: 'failed'
      })
      
      toast.add({ 
        severity: 'error', 
        summary: '错误', 
        detail: result.message || '发送消息失败', 
        life: 3000 
      })
    }
  } catch (error: any) {
    // 发送失败，更新状态
    sendingMessages.value.set(tempMsgKey, { 
        content, 
        timestamp, 
        retries: maxRetries, 
        maxRetries,
        status: 'failed'
      })
    
    toast.add({ 
      severity: 'error', 
      summary: '错误', 
      detail: error.message || '发送消息失败', 
      life: 3000 
    })
  } finally {
    // 从发送中集合移除
    setTimeout(() => {
      // 不再删除发送状态，保持消息在列表中并显示状态
      // sendingMessages.value.delete(tempMsgKey)
    }, 3000)
  }
}

// 带重试机制的消息发送
const sendWithRetry = async (content: string, maxRetries: number = 3): Promise<Result<any>> => {
  let lastError: any = null
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        // 重试前等待一段时间（指数退避）
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        
        // 更新重试次数
        const tempMsgKeys = Array.from(sendingMessages.value.keys())
        const lastTempMsgKey = tempMsgKeys[tempMsgKeys.length - 1]
        if (lastTempMsgKey) {
          const sendingMsg = sendingMessages.value.get(lastTempMsgKey)
          if (sendingMsg) {
            sendingMessages.value.set(lastTempMsgKey, {
              ...sendingMsg,
              retries: attempt
            })
          }
        }
      }
      
      const roomType = props.selectedRoom!.roomType === RoomSimpleInfoRoomTypeEnum.Group
        ? ChatCommendReqRoomTypeEnum.Group
        : ChatCommendReqRoomTypeEnum.Single

      const req: ChatCommendReq = {
        roomType: roomType,
        msgType: ChatCommendReqMsgTypeEnum.Text,
        roomId: props.selectedRoom!.roomId!,
        random: Math.random().toString(36).substring(2, 15),
        content: content
      }

      // 创建一个Promise来实现超时控制
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('请求超时')), 5000) // 5秒超时
      })

      // 发送消息的Promise
      const sendPromise = MsgClient.sendMsg(req)

      // 使用Promise.race实现超时控制
      const response = await Promise.race([sendPromise, timeoutPromise])
      const result = new Result(response as any)
      
      if (result.isSuccess()) {
        return result
      }
      
      lastError = result.message || '发送失败'
    } catch (error: any) {
      if (error.message === '请求超时') {
        lastError = '请求超时'
      } else {
        lastError = error.message || '网络错误'
      }
    }
  }
  
  // 所有重试都失败了
  throw new Error(`消息发送失败，已重试${maxRetries}次: ${lastError}`)
}

// 重新发送消息
const resendMessage = async (tempMsgKey: string) => {
  const sendingMsg = sendingMessages.value.get(tempMsgKey)
  if (!sendingMsg) return

  // 更新状态为发送中
  sendingMessages.value.set(tempMsgKey, { 
    ...sendingMsg, 
    status: 'sending',
    retries: 0
  })

  try {
    const result = await sendWithRetry(sendingMsg.content, sendingMsg.maxRetries)
    
    if (result.isSuccess() && result.data) {
      // 发送成功
      // 更新临时消息为真实消息
      const realMessage: ChatMsgVo = {
        msgId: result.data.msgKey,
        msgKey: result.data.msgKey,
        roomId: props.selectedRoom!.roomId,
        content: sendingMsg.content,
        self: true,
        serverTime: result.data.serverTime,
        senderId: result.data.senderId
      }
      
      // 替换临时消息为真实消息
      const index = messages.value.findIndex(msg => msg.msgKey === tempMsgKey)
      if (index !== -1) {
        messages.value[index] = realMessage
      }
      
      sendingMessages.value.set(tempMsgKey, { 
        ...sendingMsg, 
        status: 'sent',
        retries: 0
      })
      
      // 更新房间最后消息
      if (props.selectedRoom!.roomId) {
        emit('last-message-update', props.selectedRoom!.roomId, sendingMsg.content, result.data.serverTime)
      }
      
      if (props.selectedRoom!.roomId) {
        emit('message-sent', props.selectedRoom!.roomId, realMessage)
      }
    } else {
      // 发送失败
      sendingMessages.value.set(tempMsgKey, { 
        ...sendingMsg, 
        status: 'failed',
        retries: sendingMsg.maxRetries
      })
      
      toast.add({ 
        severity: 'error', 
        summary: '错误', 
        detail: result.message || '发送消息失败', 
        life: 3000 
      })
    }
  } catch (error: any) {
    sendingMessages.value.set(tempMsgKey, { 
      ...sendingMsg, 
      status: 'failed',
      retries: sendingMsg.maxRetries
    })
    
    toast.add({ 
      severity: 'error', 
      summary: '错误', 
      detail: error.message || '发送消息失败', 
      life: 3000 
    })
  } finally {
    // 从发送中集合移除
    setTimeout(() => {
      // 不再删除发送状态，保持消息在列表中并显示状态
      // sendingMessages.value.delete(tempMsgKey)
    }, 3000)
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
  if (!props.selectedRoom?.roomId) return
  
  try {
    const req: ChatMsgPollReq = {
      roomId: props.selectedRoom.roomId,
      roomType: props.selectedRoom.roomType === RoomSimpleInfoRoomTypeEnum.Group 
        ? ChatMsgPollReqRoomTypeEnum.Group 
        : ChatMsgPollReqRoomTypeEnum.Single,
      startTimestamp: lastPollTimestamps.value.get(props.selectedRoom.roomId)
    }
    
    const response = await MsgClient.pollMsg(req)
    const result = new Result(response)
    
    if (result.isSuccess() && result.data) {
      const newMessages: ChatMsgVo[] = result.data
      
      // 更新最后一次拉取时间
      if (props.selectedRoom.roomId) {
        lastPollTimestamps.value.set(props.selectedRoom.roomId, Date.now())
      }
      
      // 处理每条新消息，仅处理非自己发送的消息，防止未读数错误增加
      for (const message of newMessages) {
        if (!message.self) {
          handleNewMessage(message)
        }
      }
    }
  } catch (error) {
    console.warn('轮询消息失败:', error)
  }
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

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    const messagesArea = document.querySelector('.messages-area')
    if (messagesArea) {
      messagesArea.scrollTop = messagesArea.scrollHeight
      // 隐藏新消息浮标
      showNewMessageBadge.value = false
      newMessageCount.value = 0
      
      // 隐藏未读消息游标
      showUnreadCursor.value = false
    }
  })
}

// 跳转到未读消息位置
const scrollToUnread = () => {
  nextTick(() => {
    const messagesArea = document.querySelector('.messages-area')
    if (messagesArea) {
      // 查找未读消息的起始位置并滚动到该位置
      const unreadStartIndex = messages.value.length - unreadMessageCount.value
      if (unreadStartIndex >= 0 && unreadStartIndex < messages.value.length) {
        const unreadStartMessage = messages.value[unreadStartIndex]
        
        // 查找对应的DOM元素
        const messageElements = document.querySelectorAll('.message')
        for (let i = 0; i < messageElements.length; i++) {
          const msgKey = messageElements[i].getAttribute('data-msg-key')
          if (msgKey === unreadStartMessage.msgKey) {
            // 滚动到该元素位置
            messageElements[i].scrollIntoView({ behavior: 'smooth' })
            break
          }
        }
      } else {
        // 如果找不到未读消息起始位置，则滚动到底部
        messagesArea.scrollTop = messagesArea.scrollHeight
      }
      
      // 隐藏未读消息游标
      showUnreadCursor.value = false
    }
  })
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
          <div v-for="message in messages" :key="message.msgKey || message.msgId"
            :data-msg-key="message.msgKey"
            :class="['message', { sent: message.self, received: !message.self }]">
            <div class="message-content">
              <div class="message-text">{{ message.content }}</div>
              <div class="message-time">
                {{ formatTime(message.serverTime) }}
                <!-- 显示发送状态 -->
                <span v-if="message.self && message.msgKey && sendingMessages.has(message.msgKey)" class="send-status">
                  <i v-if="message.msgKey && sendingMessages.get(message.msgKey)?.status === 'sending'" 
                     class="pi pi-spin pi-spinner" 
                     :title="`发送中... (${sendingMessages.get(message.msgKey)?.retries}/${sendingMessages.get(message.msgKey)?.maxRetries})`"
                     style="font-size: 12px; margin-left: 5px;"></i>
                  <i v-else-if="message.msgKey && sendingMessages.get(message.msgKey)?.status === 'failed'" 
                     class="pi pi-exclamation-triangle error-icon"
                     style="font-size: 12px; margin-left: 5px;"
                     title="发送失败"></i>
                  <i v-else-if="message.msgKey && sendingMessages.get(message.msgKey)?.status === 'sent'" 
                     class="pi pi-check"
                     style="font-size: 12px; margin-left: 5px;"
                     title="已发送"></i>
                </span>
                
                <!-- 失败消息的重试按钮 -->
                <Button 
                  v-if="message.self && message.msgKey && sendingMessages.get(message.msgKey)?.status === 'failed'"
                  icon="pi pi-refresh" 
                  class="p-button-rounded p-button-text p-button-sm retry-button"
                  @click="() => message.msgKey && resendMessage(message.msgKey)"
                  title="重新发送"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 新消息浮标 -->
      <div v-if="showNewMessageBadge" class="new-message-badge" @click="scrollToBottom">
        <i class="pi pi-arrow-down"></i>
        <span class="new-message-count">{{ newMessageCount }}</span>
      </div>
      
      <!-- 未读消息游标 -->
      <div v-if="showUnreadCursor && unreadMessageCount > 0" class="unread-cursor" @click="scrollToUnread">
        <div class="unread-cursor-line"></div>
        <div class="unread-cursor-label">
          <span>{{ unreadMessageCount }} 条未读消息</span>
          <i class="pi pi-arrow-down"></i>
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
  position: relative;
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
  position: relative;
}

.message.sent .message-content .send-status-icon {
  margin-left: 8px;
  font-size: 12px;
  display: flex;
  align-items: center;
}

.message.sent .message-content .retry-button {
  width: 20px;
  height: 20px;
  margin-left: 4px;
}

.message-text {
  margin-bottom: 6px;
  word-wrap: break-word;
  font-size: 16px;
}

.message-time {
  font-size: 12px;
  text-align: right;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.message.sent .message-time {
  color: rgba(255, 255, 255, 0.8);
}

.message.received .message-time {
  color: #95a5a6;
}

.error-icon {
  color: #e74c3c;
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

.new-message-badge {
  position: absolute;
  bottom: 85px;
  right: 25px;
  background-color: #3498db;
  color: white;
  border-radius: 20px;
  padding: 8px 15px;
  display: flex;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 10;
  transition: all 0.3s ease;
}

.new-message-badge:hover {
  background-color: #2980b9;
  transform: translateY(-2px);
}

.new-message-count {
  background-color: #e74c3c;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  margin-left: 8px;
}

.unread-cursor {
  position: absolute;
  top: 10px;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  pointer-events: none;
}

.unread-cursor-line {
  flex: 1;
  height: 1px;
  background-color: #e74c3c;
}

.unread-cursor-label {
  background-color: #e74c3c;
  color: white;
  border-radius: 20px;
  padding: 6px 12px;
  display: flex;
  align-items: center;
  pointer-events: auto;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.unread-cursor-label:hover {
  background-color: #c0392b;
  transform: translateY(-2px);
}

.unread-cursor-label span {
  margin-right: 8px;
  font-size: 14px;
}
</style>
