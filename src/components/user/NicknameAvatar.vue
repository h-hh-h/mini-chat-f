<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  nickname?: string
  size?: number
}>()

// 提取昵称的首字母
const initials = computed(() => {
  if (!props.nickname) return '?'
  
  // 获取第一个字符，如果是emoji或其他特殊字符则显示?
  const firstChar = props.nickname.charAt(0)
  return /^[\w\u4e00-\u9fa5]$/.test(firstChar) ? firstChar.toUpperCase() : '?'
})

// 生成背景颜色
const backgroundColor = computed(() => {
  if (!props.nickname) return '#cccccc'
  
  // 根据昵称生成一个颜色
  let hash = 0
  for (let i = 0; i < props.nickname.length; i++) {
    hash = props.nickname.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  // 生成HSL颜色，确保颜色明亮且饱和度适中
  const h = hash % 360
  return `hsl(${h}, 70%, 60%)`
})

// 计算文字颜色（基于背景色亮度）
const textColor = computed(() => {
  if (!props.nickname) return '#666666'
  
  // 简单的亮度计算
  const bgColor = backgroundColor.value
  const hslMatch = bgColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
  if (hslMatch) {
    const lightness = parseInt(hslMatch[3])
    return lightness > 60 ? '#333333' : '#ffffff'
  }
  return '#ffffff'
})

// 头像尺寸
const avatarSize = computed(() => props.size || 40)
</script>

<template>
  <svg :width="avatarSize" :height="avatarSize" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" :fill="backgroundColor" rx="4" />
    <text x="20" y="20" :fill="textColor" font-family="Arial, sans-serif" font-size="20" font-weight="bold" text-anchor="middle" dominant-baseline="central">
      {{ initials }}
    </text>
  </svg>
</template>

<style scoped>
svg {
  display: block;
}
</style>