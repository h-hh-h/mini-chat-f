/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  
  // 支持<script setup>语法的组件类型定义
  const component: DefineComponent<{}, {}, any>
  export default component
}