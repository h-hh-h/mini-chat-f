import axios from 'axios';
import { Result } from '../types/response/base/Result';
import SessionManager from '../SessionManager';

class BaseClient {
    private http: any;

    constructor(baseURL: string) {
        if (baseURL) {
            this.http = axios.create({
                baseURL: baseURL,
                timeout: 10000,
                headers: {
                    "Content-Type": "application/json",
                },
            });

            // 添加请求拦截器
            this.http.interceptors.request.use(
                (config: any) => {
                    // 从 SessionManager 获取当前会话的 token
                    const token = SessionManager.getCurrentSessionData('token');
                    // Only set Authorization from session when the request did not already
                    // provide an Authorization header (respect per-request headers such as
                    // when sending on behalf of a member using a token from tokenMap).
                    if (token) {
                        const hasAuthHeader = !!(config.headers && (config.headers.Authorization || config.headers.authorization));
                        if (!hasAuthHeader) {
                            config.headers.Authorization = `Bearer ${token}`;
                        }
                    }

                    console.log('Request config:', {
                        url: config.url,
                        method: config.method,
                        headers: config.headers,
                        data: config.data
                    });

                    return config;
                },
                (error: any) => {
                    return Promise.reject(error);
                }
            );

            // 添加响应拦截器
            this.http.interceptors.response.use(
                (response: any) => {
                    console.log('Response:', response.data);
                    // 返回响应数据，而不是整个response对象
                    return response.data;
                },
                (error: any) => {
                    console.error('HTTP Error:', error.response?.data || error.message);

                    // 统一处理错误
                    if (error.response) {
                        const { status, data } = error.response;

                        switch (status) {
                            case 401:
                                // 未授权，清除当前会话的 token
                                SessionManager.clearCurrentSession();
                                // 如果不在登录页，则跳转到登录页
                                if (window.location.pathname !== '/login' && !window.location.hash.includes('login')) {
                                    window.location.href = '/#/'; // 路由到登录页
                                }
                                break;
                            case 403:
                                console.error('权限不足');
                                break;
                            case 404:
                                console.error('请求的资源不存在');
                                break;
                            case 500:
                                console.error('服务器内部错误');
                                break;
                            default:
                                console.error(data?.message || '请求失败');
                        }
                    } else if (error.request) {
                        console.error('网络错误，请检查网络连接');
                    } else {
                        console.error('请求配置错误');
                    }

                    return Promise.reject(error);
                }
            );
        } else {
            // 如果没有提供baseURL，则不创建新的实例
            this.http = null;
        }
    }

    get<T = any>(url: string, config?: any): Promise<Result<T>> {
        return this.http.get(url, config);
    }

    post<T = any>(url: string, data?: any, config?: any): Promise<Result<T>> {
        return this.http.post(url, data, config);
    }

    put<T = any>(url: string, data?: any, config?: any): Promise<Result<T>> {
        return this.http.put(url, data, config);
    }

    delete<T = any>(url: string, config?: any): Promise<Result<T>> {
        return this.http.delete(url, config);
    }

    /**
     * 将 Result 解包，若请求失败或数据为空则抛出异常
     * @param res 
     * @returns 
     */
    unwrap<T>(res: Result<T>): T {
        if (!res) {
            const err: any = new Error('Empty response');
            err.result = res;
            throw err;
        }
        if (!res.isSuccess()) {
            const err: any = new Error(`请求失败: [${res.code}] ${res.message || '未知错误'}`);
            err.result = res;
            throw err;
        }
        if (res.data === null || res.data === undefined) {
            const err: any = new Error('数据为空');
            err.result = res;
            throw err;
        }
        return res.data as T;
    }

    /**
     * 快捷的 GET 请求并解包
     * @param url 
     * @param config 
     * @returns 
     */
    async getUnwrap<T = any>(url: string, config?: any): Promise<T> {
        const res = await this.get<T>(url, config);
        return this.unwrap(res);
    }

    /**
     * 快捷的 POST 请求并解包
     * @param url
     * @param data
     * @param config
     * @returns
     */
    async postUnwrap<T = any>(url: string, data?: any, config?: any): Promise<T> {
        const res = await this.post<T>(url, data, config);
        return this.unwrap(res);
    }

    /**
     * 快捷的 PUT 请求并解包
     * @param url
     * @param data
     * @param config
     * @returns
     */
    async putUnwrap<T = any>(url: string, data?: any, config?: any): Promise<T> {
        const res = await this.put<T>(url, data, config);
        return this.unwrap(res);
    }

    /**
     * 快捷的 DELETE 请求并解包
     * @param url
     * @param config
     * @returns
     */
    async deleteUnwrap<T = any>(url: string, config?: any): Promise<T> {
        const res = await this.delete<T>(url, config);
        return this.unwrap(res);
    }
}

export default BaseClient;