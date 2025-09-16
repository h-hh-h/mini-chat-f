<script setup lang="ts">
import { UserInfoVo } from '../../api/types/request/UserInfoVo'

const props = defineProps<{
  userInfo: UserInfoVo
  loading: boolean
  wsConnected: boolean
  isTestMode: boolean
}>()

const emit = defineEmits<{
  (e: 'open-settings'): void
  (e: 'toggle-applications'): void
}>()

defineOptions({ name: 'UserPanel' })
</script>

<template>
  <div class="user-info-section">
    <div v-if="loading" class="loading">Loading user info...</div>
    <div v-else class="user-details">
      <img :src="userInfo.avatar || 'https://www.gravatar.com/avatar?d=mp'"
        :alt="userInfo.nickName || 'User Avatar'" class="avatar" />
      <div class="user-text">
        <div class="user-name">{{ userInfo.nickName || 'User' }}</div>
        <div class="user-status">
          <span v-if="!isTestMode" class="connection-status"
            :class="{ connected: wsConnected, disconnected: !wsConnected }">
            <i class="pi"
              :class="wsConnected ? 'pi-circle-fill connected-icon' : 'pi-circle-fill disconnected-icon'"></i>
            {{ wsConnected ? 'Online' : 'Offline' }}
          </span>
          <span v-else>Test Mode</span>
        </div>
      </div>
      <div class="user-actions">
        <Button @click="$emit('open-settings')" icon="pi pi-cog" class="p-button-secondary" size="small" rounded text />
        <Button @click="$emit('toggle-applications')" icon="pi pi-user-plus"
          class="p-button-secondary"
          size="small" rounded text />
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-info-section {
  padding: 20px;
  border-bottom: 1px solid #e1e8ed;
  background: linear-gradient(to right, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.user-details {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 50px;
  height: 50px;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  object-fit: cover;
}

.user-text {
  flex: 1;
}

.user-text .user-name {
  font-weight: 600;
  font-size: 16px;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.user-text .user-status {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 5px;
}

.connected {
  color: #7fff00;
}

.disconnected {
  color: #ff6347;
}

.connected-icon {
  color: #7fff00;
  font-size: 11px;
}

.disconnected-icon {
  color: #ff6347;
  font-size: 11px;
}

.user-actions {
  display: flex;
  align-items: center;
}

.loading {
  padding: 25px;
  text-align: center;
  color: #95a5a6;
  font-weight: 500;
}
</style>