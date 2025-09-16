import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import IMView from '../views/IMView.vue'
import SessionManager from '../api/SessionManager'

// Authentication guard
const authGuard = async (to: any, from: any, next: any) => {
  // 检查URL中是否包含会话ID
  const urlParams = new URLSearchParams(window.location.search);
  const sessionIdFromUrl = urlParams.get('sessionId');
  
  // 如果URL中有会话ID，则设置为当前会话
  if (sessionIdFromUrl) {
    SessionManager.setCurrentSessionId(sessionIdFromUrl);
  }
  
  // 获取当前会话的token
  const token = SessionManager.getCurrentSessionData('token');
  
  if (token) {
    next() // 允许访问受保护的路由
  } else {
    next('/') // 重定向到登录页
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginView
    },
    {
      path: '/im',
      name: 'im',
      component: IMView,
      beforeEnter: authGuard
    },
    {
      path: '/im-test',
      name: 'im-test',
      component: IMView
    }
  ]
})

export default router