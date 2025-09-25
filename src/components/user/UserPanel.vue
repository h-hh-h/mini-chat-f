<script setup lang="ts">
import { computed } from 'vue'
import { UserInfoVo } from '../../api/types/request/UserInfoVo'
import { generateNicknameAvatar } from '../../utils/avatarUtils'

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

// 处理头像显示逻辑
const getAvatarUrl = (avatar: string | null | undefined, nickName: string | undefined) => {
  console.log('getAvatarUrl called with:', { avatar, nickName })
  console.log('Processing avatar:', avatar, 'name:', nickName);
  
  // 检查是否是逗号分隔的多个头像
  if (avatar && avatar.includes(',')) {
    // 过滤掉无效值（包括null、undefined、空字符串和'null'字符串）
    const avatarUrls = avatar.split(',').filter(url => url && url.trim() !== '' && url !== 'null');
    console.log('Multiple avatars detected:', avatarUrls);
    if (avatarUrls.length > 0) {
      // 如果有有效的头像，生成九宫格头像
      return generateGroupAvatar(avatarUrls, nickName);
    } else {
      // 如果所有头像都无效，使用默认头像
      const defaultAvatar = generateNicknameAvatar(nickName);
      console.log('All avatars are invalid, using default avatar for name:', nickName, 'avatar:', defaultAvatar);
      return defaultAvatar;
    }
  }
  
  // 检查单个头像是否为无效值
  if (!avatar || avatar === 'null' || avatar.trim() === '') {
    const defaultAvatar = generateNicknameAvatar(nickName);
    console.log('Invalid single avatar, using default avatar for name:', nickName, 'avatar:', defaultAvatar);
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

// 计算属性确保响应式更新
const displayName = computed(() => {
  console.log('Computing displayName with userInfo:', props.userInfo)
  return props.userInfo?.nickName || props.userInfo?.account || 'User'
})

const displayAvatar = computed(() => {
  console.log('Computing displayAvatar with userInfo:', props.userInfo)
  return getAvatarUrl(props.userInfo?.avatar, props.userInfo?.nickName)
})

console.log('UserPanel received props:', props)
</script>

<template>
  <div class="user-info-section">
    <div v-if="loading" class="loading">Loading user info...</div>
    <div v-else class="user-details">
      <img :src="displayAvatar" :alt="displayName" class="avatar" />
      <div class="user-text">
        <div class="user-name">{{ displayName }}</div>
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