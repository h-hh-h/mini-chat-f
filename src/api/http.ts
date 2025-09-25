// import axios from "axios";
// import { SERVER_BASE_URL } from "@/config/appConfig";
// import SessionManager from "./SessionManager";

// const http = axios.create({
//   baseURL: SERVER_BASE_URL,
//   timeout: 10000,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// // 请求拦截器
// http.interceptors.request.use(
//   (config) => {
//     // 从 SessionManager 获取当前会话的 token
//     const token = SessionManager.getCurrentSessionData('token');
//     // Only set Authorization from session when the request did not already
//     // provide an Authorization header (respect per-request headers such as
//     // when sending on behalf of a member using a token from tokenMap).
//     if (token) {
//       const hasAuthHeader = !!(config.headers && (config.headers.Authorization || config.headers.authorization));
//       if (!hasAuthHeader) {
//         config.headers.Authorization = `Bearer ${token}`;
//       }
//     }
    
//     console.log('Request config:', {
//       url: config.url,
//       method: config.method,
//       headers: config.headers,
//       data: config.data
//     });
    
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // 响应拦截器
// http.interceptors.response.use(
//   (response) => {
//     console.log('Response:', response.data);
//     // 返回响应数据，而不是整个response对象
//     return response.data;
//   },
//   (error) => {
//     console.error('HTTP Error:', error.response?.data || error.message);
    
//     // 统一处理错误
//     if (error.response) {
//       const { status, data } = error.response;
      
//       switch (status) {
//         case 401:
//           // 未授权，清除当前会话的 token
//           SessionManager.clearCurrentSession();
//           // 如果不在登录页，则跳转到登录页
//           if (window.location.pathname !== '/login' && !window.location.hash.includes('login')) {
//             window.location.href = '/#/'; // 路由到登录页
//           }
//           break;
//         case 403:
//           console.error('权限不足');
//           break;
//         case 404:
//           console.error('请求的资源不存在');
//           break;
//         case 500:
//           console.error('服务器内部错误');
//           break;
//         default:
//           console.error(data?.message || '请求失败');
//       }
//     } else if (error.request) {
//       console.error('网络错误，请检查网络连接');
//     } else {
//       console.error('请求配置错误');
//     }
    
//     return Promise.reject(error);
//   }
// );

// export default http;