<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { AuthClient } from '../api'
import { LoginReq } from '../api/types/request/LoginReq'
import { Result } from '../api/types/response/base/Result'
import SessionManager from '../api/SessionManager'


const router = useRouter()
const toast = useToast()

// 切换登录/注册模式
const isRegisterMode = ref(false)
// 登录方式：password 或 verification
const loginMethod = ref('password')
const toggleMode = () => {
  isRegisterMode.value = !isRegisterMode.value
  resetForm()
}

// 表单数据
const loginForm = reactive({
  account: '',
  password: '',
  confirmPassword: '',
  email: '',
  emailCode: '',
  phone: '',
  phoneCode: ''
})

// 表单验证错误
const errors = ref({
  account: '',
  password: '',
  confirmPassword: '',
  email: '',
  emailCode: '',
  phone: '',
  phoneCode: ''
})

// 加载状态
const loading = ref(false)
const sendingEmailCode = ref(false)
const sendingPhoneCode = ref(false)

// 验证码显示
const emailVerificationCode = ref('')
const phoneVerificationCode = ref('')

// 是否显示验证码输入框
const showEmailCodeInput = computed(() => {
  return isRegisterMode.value && loginForm.email
})

const showPhoneCodeInput = computed(() => {
  return isRegisterMode.value && loginForm.phone
})

// 重置表单
const resetForm = () => {
  loginForm.account = ''
  loginForm.password = ''
  loginForm.confirmPassword = ''
  loginForm.email = ''
  loginForm.emailCode = ''
  loginForm.phone = ''
  loginForm.phoneCode = ''
  
  // 清空错误信息
  Object.keys(errors.value).forEach(key => {
    (errors.value as any)[key] = ''
  })
  
  // 清空验证码显示
  emailVerificationCode.value = ''
  phoneVerificationCode.value = ''
  
  // 默认登录方式为密码登录
  loginMethod.value = 'password'
}

// 验证表单
const validateForm = () => {
  let isValid = true
  
  // 清空之前的错误
  Object.keys(errors.value).forEach(key => {
    (errors.value as any)[key] = ''
  })
  
  if (!isRegisterMode.value) {
    // 登录模式
    if (loginMethod.value === 'password') {
      // 账号验证（密码登录需要账号）
      if (!loginForm.account) {
        errors.value.account = '请输入账号'
        isValid = false
      } else if (loginForm.account.length < 3) {
        errors.value.account = '账号至少3个字符'
        isValid = false
      }
      
      // 密码登录验证
      if (!loginForm.password) {
        errors.value.password = '请输入密码'
        isValid = false
      } else if (loginForm.password.length < 6) {
        errors.value.password = '密码至少6个字符'
        isValid = false
      }
    } else {
      // 验证码登录验证（不需要账号，只需要手机号或邮箱）
      if (!loginForm.phone && !loginForm.email) {
        errors.value.phone = '请输入手机号或邮箱'
        errors.value.email = '请输入手机号或邮箱'
        isValid = false
      }
      
      if (loginForm.phone && !loginForm.phoneCode) {
        errors.value.phoneCode = '请输入手机验证码'
        isValid = false
      }
      
      if (loginForm.email && !loginForm.emailCode) {
        errors.value.emailCode = '请输入邮箱验证码'
        isValid = false
      }
    }
  } else {
    // 注册模式验证
    // 账号验证
    if (!loginForm.account) {
      errors.value.account = '请输入账号'
      isValid = false
    } else if (loginForm.account.length < 3) {
      errors.value.account = '账号至少3个字符'
      isValid = false
    }
    
    // 密码验证
    if (!loginForm.password) {
      errors.value.password = '请输入密码'
      isValid = false
    } else if (loginForm.password.length < 6) {
      errors.value.password = '密码至少6个字符'
      isValid = false
    }
    
    // 确认密码验证
    if (!loginForm.confirmPassword) {
      errors.value.confirmPassword = '请确认密码'
      isValid = false
    } else if (loginForm.password !== loginForm.confirmPassword) {
      errors.value.confirmPassword = '两次输入的密码不一致'
      isValid = false
    }
    
    // 邮箱和邮箱验证码（可选）
    if (loginForm.email && !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(loginForm.email)) {
      errors.value.email = '请输入有效的邮箱地址'
      isValid = false
    }
    
    if (loginForm.email && !loginForm.emailCode) {
      errors.value.emailCode = '请输入邮箱验证码'
      isValid = false
    }
    
    // 手机和手机验证码（可选）
    if (loginForm.phone && !/^1[3-9]\d{9}$/.test(loginForm.phone)) {
      errors.value.phone = '请输入有效的手机号'
      isValid = false
    }
    
    if (loginForm.phone && !loginForm.phoneCode) {
      errors.value.phoneCode = '请输入手机验证码'
      isValid = false
    }
  }
  
  return isValid
}

// 发送邮箱验证码
const sendEmailCode = async () => {
  if (!loginForm.email) {
    toast.add({ severity: 'error', summary: '错误', detail: '请输入邮箱地址', life: 3000 })
    return
  }
  
  if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(loginForm.email)) {
    toast.add({ severity: 'error', summary: '错误', detail: '请输入有效的邮箱地址', life: 3000 })
    return
  }
  
  try {
    sendingEmailCode.value = true
    const response = await AuthClient.emailCode(loginForm.email)
    const result = new Result(response)
    if (result.isSuccess() && result.data) {
      emailVerificationCode.value = result.data
      toast.add({ severity: 'success', summary: '成功', detail: '验证码已发送至您的邮箱', life: 3000 })
    } else {
      toast.add({ severity: 'error', summary: '错误', detail: result.message || '发送邮箱验证码失败', life: 3000 })
    }
  } catch (error: any) {
    console.error('发送邮箱验证码失败:', error)
    toast.add({ severity: 'error', summary: '错误', detail: error.message || '发送邮箱验证码失败', life: 3000 })
  } finally {
    sendingEmailCode.value = false
  }
}

// 发送手机验证码
const sendPhoneCode = async () => {
  if (!loginForm.phone) {
    toast.add({ severity: 'error', summary: '错误', detail: '请输入手机号', life: 3000 })
    return
  }
  
  if (!/^1[3-9]\d{9}$/.test(loginForm.phone)) {
    toast.add({ severity: 'error', summary: '错误', detail: '请输入有效的手机号', life: 3000 })
    return
  }
  
  try {
    sendingPhoneCode.value = true
    const response = await AuthClient.phoneCode(loginForm.phone)
    const result = new Result(response)
    if (result.isSuccess() && result.data) {
      phoneVerificationCode.value = result.data
      toast.add({ severity: 'success', summary: '成功', detail: '验证码已发送至您的手机', life: 3000 })
    } else {
      toast.add({ severity: 'error', summary: '错误', detail: result.message || '发送手机验证码失败', life: 3000 })
    }
  } catch (error: any) {
    console.error('发送手机验证码失败:', error)
    toast.add({ severity: 'error', summary: '错误', detail: error.message || '发送手机验证码失败', life: 3000 })
  } finally {
    sendingPhoneCode.value = false
  }
}

// 登录
const login = async () => {
  if (!validateForm()) return
  
  try {
    loading.value = true
    
    const loginReq = new LoginReq()
    
    if (loginMethod.value === 'password') {
      // 密码登录
      loginReq.account = loginForm.account
      loginReq.password = loginForm.password
    } else {
      // 验证码登录（不需要账号）
      loginReq.phone = loginForm.phone || undefined
      loginReq.phoneCode = loginForm.phoneCode || undefined
      loginReq.email = loginForm.email || undefined
      loginReq.emailCode = loginForm.emailCode || undefined
    }
    
    const response = await AuthClient.login(loginReq)
    const result = new Result(response)
    console.log('Login response:', result)
    if (result.isSuccess()) {
      // 生成新的会话ID
      const sessionId = SessionManager.generateSessionId();
      
      // 保存会话数据
      SessionManager.setCurrentSessionId(sessionId);
      SessionManager.saveSessionData(sessionId, 'token', result.data?.token);
      SessionManager.saveSessionData(sessionId, 'userInfo', {
        account: loginForm.account || loginForm.phone || loginForm.email
      });
      
      // 重定向到IM页面，并在URL中包含会话ID
      router.push(`/im?sessionId=${sessionId}`)
    } else {
      toast.add({ severity: 'error', summary: '错误', detail: result.message || '登录失败', life: 3000 })
    }
  } catch (error: any) {
    console.error('登录失败:', error)
    toast.add({ severity: 'error', summary: '错误', detail: error.message || '登录失败', life: 3000 })
  } finally {
    loading.value = false
  }
}

// 注册
const register = async () => {
  if (!validateForm()) return
  
  try {
    loading.value = true
    
    const loginReq = new LoginReq()
    loginReq.account = loginForm.account
    loginReq.password = loginForm.password
    loginReq.email = loginForm.email || undefined
    loginReq.emailCode = loginForm.emailCode || undefined
    loginReq.phone = loginForm.phone || undefined
    loginReq.phoneCode = loginForm.phoneCode || undefined
    
    const response = await AuthClient.registry(loginReq)
    const result = new Result(response)
    if (result.isSuccess()) {
      // 生成新的会话ID
      const sessionId = SessionManager.generateSessionId();
      
      // 保存会话数据
      SessionManager.setCurrentSessionId(sessionId);
      SessionManager.saveSessionData(sessionId, 'token', result.data?.token);
      SessionManager.saveSessionData(sessionId, 'userInfo', {
        account: loginForm.account
      });
      
      // 重定向到IM页面，并在URL中包含会话ID
      router.push(`/im?sessionId=${sessionId}`)
    } else {
      toast.add({ severity: 'error', summary: '错误', detail: result.message || '注册失败', life: 3000 })
    }
  } catch (error: any) {
    console.error('注册失败:', error)
    toast.add({ severity: 'error', summary: '错误', detail: error.message || '注册失败', life: 3000 })
  } finally {
    loading.value = false
  }
}

// 提交表单
const submitForm = () => {
  if (isRegisterMode.value) {
    register()
  } else {
    login()
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="logo">
          <i class="pi pi-comments" style="font-size: 2.5rem"></i>
        </div>
        <h2>{{ isRegisterMode ? '创建账户' : '欢迎回来' }}</h2>
        <p class="subtitle">{{ isRegisterMode ? '注册新账户以开始聊天' : '登录您的账户' }}</p>
      </div>
      
      <div class="login-form">
        <!-- 登录方式切换 (仅在登录模式下显示) -->
        <div v-if="!isRegisterMode" class="login-methods">
          <div class="method-toggle">
            <Button 
              :class="{ 'active': loginMethod === 'password' }"
              @click="loginMethod = 'password'"
              label="密码登录"
              class="method-button"
              text
            />
            <Button 
              :class="{ 'active': loginMethod === 'verification' }"
              @click="loginMethod = 'verification'"
              label="验证码登录"
              class="method-button"
              text
            />
          </div>
        </div>
        
        <!-- 账号 (仅在密码登录或注册时显示) -->
        <div v-if="isRegisterMode || (loginMethod === 'password')" class="form-field">
          <div class="input-wrapper">
            <i class="pi pi-user input-icon"></i>
            <InputText 
              id="account" 
              v-model="loginForm.account" 
              :class="{ 'p-invalid': errors.account }"
              placeholder="用户名"
            />
          </div>
          <small v-if="errors.account" class="p-error">{{ errors.account }}</small>
        </div>
        
        <!-- 密码 (密码登录方式) -->
        <div v-if="!isRegisterMode && loginMethod === 'password'" class="form-field">
          <div class="input-wrapper">
            <i class="pi pi-lock input-icon"></i>
            <Password 
              id="password" 
              v-model="loginForm.password" 
              :class="{ 'p-invalid': errors.password }"
              placeholder="密码"
              :feedback="false"
              toggleMask
              class="password-input"
            />
          </div>
          <small v-if="errors.password" class="p-error">{{ errors.password }}</small>
        </div>
        
        <!-- 手机号和验证码 (验证码登录方式) -->
        <div v-if="!isRegisterMode && loginMethod === 'verification'" class="form-field">
          <div class="input-wrapper">
            <i class="pi pi-mobile input-icon"></i>
            <InputText 
              id="phone" 
              v-model="loginForm.phone" 
              :class="{ 'p-invalid': errors.phone }"
              placeholder="手机号码"
              class="input-with-button"
            />
            <Button 
              label="验证码" 
              @click="sendPhoneCode" 
              :loading="sendingPhoneCode"
              :disabled="!loginForm.phone || sendingPhoneCode"
              class="code-button"
              outlined
            />
          </div>
          <small v-if="errors.phone" class="p-error">{{ errors.phone }}</small>
          <!-- 显示手机验证码 -->
          <div v-if="phoneVerificationCode" class="verification-code-display">
            <small class="verification-code">测试验证码: {{ phoneVerificationCode }}</small>
          </div>
        </div>
        
        <div v-if="!isRegisterMode && loginMethod === 'verification' && loginForm.phone" class="form-field">
          <div class="input-wrapper">
            <i class="pi pi-shield input-icon"></i>
            <InputText 
              id="phoneCode" 
              v-model="loginForm.phoneCode" 
              :class="{ 'p-invalid': errors.phoneCode }"
              placeholder="手机验证码"
            />
          </div>
          <small v-if="errors.phoneCode" class="p-error">{{ errors.phoneCode }}</small>
        </div>
        
        <!-- 邮箱和验证码 (验证码登录方式) -->
        <div v-if="!isRegisterMode && loginMethod === 'verification'" class="form-field">
          <div class="input-wrapper">
            <i class="pi pi-envelope input-icon"></i>
            <InputText 
              id="email" 
              v-model="loginForm.email" 
              :class="{ 'p-invalid': errors.email }"
              placeholder="邮箱地址"
              class="input-with-button"
            />
            <Button 
              label="验证码" 
              @click="sendEmailCode" 
              :loading="sendingEmailCode"
              :disabled="!loginForm.email || sendingEmailCode"
              class="code-button"
              outlined
            />
          </div>
          <small v-if="errors.email" class="p-error">{{ errors.email }}</small>
          <!-- 显示邮箱验证码 -->
          <div v-if="emailVerificationCode" class="verification-code-display">
            <small class="verification-code">测试验证码: {{ emailVerificationCode }}</small>
          </div>
        </div>
        
        <div v-if="!isRegisterMode && loginMethod === 'verification' && loginForm.email" class="form-field">
          <div class="input-wrapper">
            <i class="pi pi-shield input-icon"></i>
            <InputText 
              id="emailCode" 
              v-model="loginForm.emailCode" 
              :class="{ 'p-invalid': errors.emailCode }"
              placeholder="邮箱验证码"
            />
          </div>
          <small v-if="errors.emailCode" class="p-error">{{ errors.emailCode }}</small>
        </div>
        
        <!-- 注册时显示密码 -->
        <div v-if="isRegisterMode" class="form-field">
          <div class="input-wrapper">
            <i class="pi pi-lock input-icon"></i>
            <Password 
              id="password" 
              v-model="loginForm.password" 
              :class="{ 'p-invalid': errors.password }"
              placeholder="密码"
              :feedback="false"
              toggleMask
              class="password-input"
            />
          </div>
          <small v-if="errors.password" class="p-error">{{ errors.password }}</small>
        </div>
        
        <!-- 注册时显示确认密码 -->
        <div v-if="isRegisterMode" class="form-field">
          <div class="input-wrapper">
            <i class="pi pi-lock input-icon"></i>
            <Password 
              id="confirmPassword" 
              v-model="loginForm.confirmPassword" 
              :class="{ 'p-invalid': errors.confirmPassword }"
              placeholder="确认密码"
              :feedback="false"
              toggleMask
              class="password-input"
            />
          </div>
          <small v-if="errors.confirmPassword" class="p-error">{{ errors.confirmPassword }}</small>
        </div>
        
        <!-- 注册时显示邮箱和验证码 -->
        <div v-if="isRegisterMode" class="form-field">
          <div class="input-wrapper">
            <i class="pi pi-envelope input-icon"></i>
            <InputText 
              id="email" 
              v-model="loginForm.email" 
              :class="{ 'p-invalid': errors.email }"
              placeholder="邮箱地址"
              class="input-with-button"
            />
            <Button 
              label="验证码" 
              @click="sendEmailCode" 
              :loading="sendingEmailCode"
              :disabled="!loginForm.email || sendingEmailCode"
              class="code-button"
              outlined
            />
          </div>
          <small v-if="errors.email" class="p-error">{{ errors.email }}</small>
          <!-- 显示邮箱验证码 -->
          <div v-if="emailVerificationCode" class="verification-code-display">
            <small class="verification-code">测试验证码: {{ emailVerificationCode }}</small>
          </div>
        </div>
        
        <div v-if="showEmailCodeInput" class="form-field">
          <div class="input-wrapper">
            <i class="pi pi-shield input-icon"></i>
            <InputText 
              id="emailCode" 
              v-model="loginForm.emailCode" 
              :class="{ 'p-invalid': errors.emailCode }"
              placeholder="邮箱验证码"
            />
          </div>
          <small v-if="errors.emailCode" class="p-error">{{ errors.emailCode }}</small>
        </div>
        
        <!-- 注册时显示手机和验证码 -->
        <div v-if="isRegisterMode" class="form-field">
          <div class="input-wrapper">
            <i class="pi pi-mobile input-icon"></i>
            <InputText 
              id="phone" 
              v-model="loginForm.phone" 
              :class="{ 'p-invalid': errors.phone }"
              placeholder="手机号码"
              class="input-with-button"
            />
            <Button 
              label="验证码" 
              @click="sendPhoneCode" 
              :loading="sendingPhoneCode"
              :disabled="!loginForm.phone || sendingPhoneCode"
              class="code-button"
              outlined
            />
          </div>
          <small v-if="errors.phone" class="p-error">{{ errors.phone }}</small>
          <!-- 显示手机验证码 -->
          <div v-if="phoneVerificationCode" class="verification-code-display">
            <small class="verification-code">测试验证码: {{ phoneVerificationCode }}</small>
          </div>
        </div>
        
        <div v-if="showPhoneCodeInput" class="form-field">
          <div class="input-wrapper">
            <i class="pi pi-shield input-icon"></i>
            <InputText 
              id="phoneCode" 
              v-model="loginForm.phoneCode" 
              :class="{ 'p-invalid': errors.phoneCode }"
              placeholder="手机验证码"
            />
          </div>
          <small v-if="errors.phoneCode" class="p-error">{{ errors.phoneCode }}</small>
        </div>
        
        <!-- 提交按钮 -->
        <div class="form-actions">
          <Button 
            :label="isRegisterMode ? '创建账户' : '登录'" 
            @click="submitForm" 
            :loading="loading"
            class="submit-button"
          />
        </div>
        
        <!-- 切换登录/注册 -->
        <div class="form-footer">
          <p>
            {{ isRegisterMode ? '已有账户?' : '没有账户?' }}
            <a href="#" @click.prevent="toggleMode" class="switch-link">
              {{ isRegisterMode ? '立即登录' : '立即注册' }}
            </a>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  padding: 2.5rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  color: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.login-header h2 {
  margin: 0 0 0.5rem;
  color: #333;
  font-weight: 600;
  font-size: 1.75rem;
}

.subtitle {
  margin: 0;
  color: #666;
  font-size: 1rem;
}

.login-methods {
  margin-bottom: 1.5rem;
}

.method-toggle {
  display: flex;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.method-button {
  flex: 1;
  border-radius: 0;
  background: transparent;
  color: #666;
  font-weight: 500;
}

.method-button.active {
  background: #667eea;
  color: white;
}

.form-field {
  margin-bottom: 1.5rem;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 15px;
  color: #7b7b7b;
  z-index: 2;
}

.p-inputtext, .p-password, .p-password-input {
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border-radius: 8px;
  border: 1px solid #ddd;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.p-inputtext:focus, .p-password:focus, .p-password-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

.password-input {
  width: 100%;
}

.input-with-button {
  flex: 1;
  margin-right: 0.5rem;
}

.code-button {
  height: 52px;
  border-radius: 8px;
  min-width: 90px;
}

.form-actions {
  margin: 2rem 0 1.5rem;
}

.submit-button {
  width: 100%;
  padding: 1rem;
  font-size: 1.1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
}

.submit-button:hover {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.form-footer {
  text-align: center;
}

.switch-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
}

.switch-link:hover {
  color: #764ba2;
  text-decoration: underline;
}

.p-error {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.85rem;
}

.verification-code-display {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: #e3f2fd;
  border-radius: 4px;
  text-align: center;
}

.verification-code {
  color: #1976d2;
  font-weight: 500;
  font-size: 0.85rem;
}

@media (max-width: 480px) {
  .login-card {
    padding: 1.5rem;
    margin: 0 1rem;
  }
  
  .login-header h2 {
    font-size: 1.5rem;
  }
}
</style>