<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { UserClient, RoomClient } from '../../api'
import WebSocketClient from '../../api/WebSocketClient'
import SessionManager from '../../api/SessionManager'
import { UserInfoVo } from '../../api/types/request/UserInfoVo'
import { Result } from '../../api/types/response/base/Result'
import { WEBSOCKET_URL } from '../../config/appConfig'
import { RoomSimpleInfo } from '../../api/types/base/RoomSimpleInfo'
import UserPanel from '../user/UserPanel.vue'
import ApplicationsPanel from '../friends/ApplicationsPanel.vue'
import UserSettingsPanel from '../user/UserSettingsPanel.vue'
import ContactsPanel from '../friends/ContactsPanel.vue'
import ChatsPanel from '../rooms/ChatsPanel.vue'
import ChatWindow from '../chat/ChatWindow.vue'
import RoomDetailPanel from '../rooms/RoomDetailPanel.vue'

const toast = useToast()

// User information
const userInfo = ref<UserInfoVo>({})
const loadingUserInfo = ref(true)

// 添加状态来跟踪当前选中的板块
const activeSection = ref<'chats' | 'contacts'>('chats')

// User settings panel
const showUserSettings = ref(false)

// Applications panel
const showApplicationsPanel = ref(false)

// WebSocket client
const wsClient = ref<WebSocketClient | null>(null)
const wsConnected = ref(false)

// 当前选中的房间
const selectedRoom = ref<RoomSimpleInfo | null>(null)

// Chats panel 引用
const chatsPanelRef = ref<InstanceType<typeof ChatsPanel> | null>(null)
// Contacts panel 引用
const contactsPanelRef = ref<InstanceType<typeof ContactsPanel> | null>(null)

// 用于触发ChatsPanel刷新的响应式变量
const refreshChats = ref(0)

// 添加房间详情面板显示状态
const showRoomDetails = ref(false)
const detailRoom = ref<RoomSimpleInfo | null>(null)

// Check if we're in test mode (no authentication)
const isTestMode = window.location.hash.includes('im-test') || window.location.pathname.includes('im-test')

// 获取当前会话的用户信息
const getCurrentUserInfo = () => {
  return SessionManager.getCurrentSessionData('userInfo') || {}
}

defineExpose({
  userInfo,
  loadingUserInfo,
  activeSection,
  showUserSettings,
  showApplicationsPanel,
  wsConnected,
  isTestMode
})

// 页面加载时初始化
onMounted(async () => {
  if (isTestMode) {
    // 测试模式下使用模拟数据
    loadingUserInfo.value = false
    wsConnected.value = true
    return
  }

  try {
    // 初始化用户信息
    await initUserInfo()

    // 连接WebSocket
    connectWebSocket()
  } catch (error) {
    console.error('初始化失败:', error)
    toast.add({ severity: 'error', summary: '错误', detail: '初始化失败', life: 3000 })
  }
})

// 页面卸载时断开WebSocket连接和轮询
onUnmounted(() => {
  if (wsClient.value) {
    wsClient.value.disconnect()
  }
})

// 初始化用户信息
const initUserInfo = async () => {
  try {
    loadingUserInfo.value = true

    // 从会话中获取用户信息
    const sessionUserInfo = getCurrentUserInfo()
    if (sessionUserInfo && sessionUserInfo.account) {
      // 如果会话中有用户信息，则使用会话中的信息
      userInfo.value = sessionUserInfo
    } else {
      // 否则从服务器获取用户信息
      const response = await UserClient.userInfo()
      const result = new Result(response)
      if (result.isSuccess()) {
        userInfo.value = result.data || {}
        // 保存到会话中
        SessionManager.saveCurrentSessionData('userInfo', userInfo.value)
      } else {
        throw new Error(result.message || '获取用户信息失败')
      }
    }
  } catch (error: any) {
    console.error('获取用户信息失败:', error)
    toast.add({ severity: 'error', summary: '错误', detail: error.message || '获取用户信息失败', life: 3000 })
    throw error
  } finally {
    loadingUserInfo.value = false
  }
}

// 连接WebSocket
const connectWebSocket = () => {
  try {
    wsClient.value = new WebSocketClient(WEBSOCKET_URL)

    // 连接成功处理
    wsClient.value.onOpen(() => {
      console.log('WebSocket连接成功')
      wsConnected.value = true
    })

    // 连接关闭处理
    wsClient.value.onClose(() => {
      console.log('WebSocket连接关闭')
      wsConnected.value = false
    })

    // 连接错误处理
    wsClient.value.onError((error: Event) => {
      console.error('WebSocket连接错误:', error)
      wsConnected.value = false
      toast.add({ severity: 'error', summary: '错误', detail: 'WebSocket连接错误', life: 3000 })
    })

    // 建立连接
    wsClient.value.connect()
  } catch (error) {
    console.error('连接WebSocket失败:', error)
    toast.add({ severity: 'error', summary: '错误', detail: '连接WebSocket失败', life: 3000 })
  }
}

// 切换板块的函数
const switchSection = (section: 'chats' | 'contacts') => {
  activeSection.value = section
}

// 切换好友申请面板
const toggleApplicationsPanel = () => {
  showApplicationsPanel.value = !showApplicationsPanel.value
}

// 打开用户设置面板
const openUserSettings = () => {
  showUserSettings.value = true
}

// 关闭用户设置面板
const closeUserSettings = () => {
  showUserSettings.value = false
}

// 选择房间
const selectRoom = (room: RoomSimpleInfo) => {
  selectedRoom.value = room
}

// 打开房间详情
const openRoomDetails = (room: RoomSimpleInfo) => {
  detailRoom.value = room
  showRoomDetails.value = true
}

// 关闭房间详情
const closeRoomDetails = () => {
  showRoomDetails.value = false
  detailRoom.value = null
}

// 处理新创建的房间
const handleNewRoom = (room: RoomSimpleInfo) => {
  // 选择新创建的房间
  selectRoom(room)
  
  // 切换到聊天板块
  switchSection('chats')
  
  // 触发ChatsPanel刷新
  refreshChats.value++
}

// 处理从联系人面板选择房间的情况
const handleSelectRoom = (room: RoomSimpleInfo) => {
  // 选择房间
  selectRoom(room)
  
  // 切换到聊天板块
  switchSection('chats')
  
  // 清除联系人面板的选中状态
  setTimeout(() => {
    if (contactsPanelRef.value && typeof contactsPanelRef.value.clearSelectedGroup === 'function') {
      contactsPanelRef.value.clearSelectedGroup()
    }
  }, 0)
}
</script>

<template>
  <div class="im-container">
    <!-- Left Panel -->
    <div class="left-panel">
      <!-- User Info -->
      <UserPanel 
        :user-info="userInfo" 
        :loading="loadingUserInfo" 
        :ws-connected="wsConnected"
        :is-test-mode="isTestMode"
        @open-settings="openUserSettings"
        @toggle-applications="toggleApplicationsPanel" />

      <!-- Applications Panel (Friend Applications and Add Friend) -->
      <ApplicationsPanel 
        v-if="showApplicationsPanel"
        @close="showApplicationsPanel = false" />

      <!-- User Settings Panel -->
      <UserSettingsPanel 
        v-else-if="showUserSettings"
        :user-info="userInfo"
        @close="closeUserSettings" />

      <!-- Chats and Contacts Module -->
      <div v-else class="chats-contacts-container">
        <div class="chats-contacts-header">
          <div class="section-tabs">
            <button :class="['tab-button', { active: activeSection === 'chats' }]" @click="switchSection('chats')">
              Chats
            </button>
            <button :class="['tab-button', { active: activeSection === 'contacts' }]" @click="switchSection('contacts')">
              Contacts
            </button>
          </div>
        </div>

        <div class="chats-contacts-content">
          <!-- Chats Section -->
          <ChatsPanel 
            :key="refreshChats"
            :selected-room="selectedRoom"
            ref="chatsPanelRef"
            v-show="activeSection === 'chats' && !showRoomDetails" 
            @select-room="selectRoom"
            @open-room-details="openRoomDetails" />

          <!-- Room Detail Section -->
          <RoomDetailPanel 
            v-if="showRoomDetails && detailRoom"
            :room="detailRoom"
            @back="closeRoomDetails" />

          <!-- Contacts Section -->
          <ContactsPanel 
            ref="contactsPanelRef"
            v-show="activeSection === 'contacts' && !showRoomDetails" 
            @select-room="handleSelectRoom"
            @switch-section="switchSection" />
        </div>
      </div>
    </div>
    
    <!-- Right Panel -->
    <ChatWindow :selected-room="selectedRoom" />
  </div>
</template>

<style scoped>
.im-container {
  display: flex;
  height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.left-panel {
  width: 350px;
  background: linear-gradient(to bottom, #ffffff, #f8f9fa);
  border-right: 1px solid #e1e8ed;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.05);
}

.chats-contacts-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chats-contacts-header {
  padding: 0;
  border-bottom: 1px solid #e1e8ed;
  background-color: #f0f8ff;
}

.section-tabs {
  display: flex;
  background: linear-gradient(to bottom, #ffffff, #f8f9fa);
}

.section-tabs .tab-button {
  flex: 1;
  padding: 16px;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 600;
  color: #7f8c8d;
  font-size: 16px;
  transition: all 0.3s ease;
  position: relative;
}

.section-tabs .tab-button.active {
  color: #3498db;
  background-color: #fff;
}

.section-tabs .tab-button.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(to right, #3498db, #2c3e50);
  border-radius: 3px;
}

.section-tabs .tab-button:not(.active):hover {
  background-color: #e1f0fa;
  color: #2c3e50;
}

.chats-contacts-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #fafcff;
}
</style>