<script setup lang="ts">
import { onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'

// 初始化Toast
const toast = useToast()

onMounted(() => {
  // 可以在这里添加全局初始化逻辑
})
</script>

<template>
  <Toast />
  <router-view />
</template>

<style>
/* 全局样式：确保html和body元素占满整个视口 */
html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

/* minimal reset */
:host { display: block; }
</style>