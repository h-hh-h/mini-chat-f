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

<style scoped>
/* minimal reset */
:host { display: block; }
</style>