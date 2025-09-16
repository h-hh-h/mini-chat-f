import http from '../http';
import { Result } from '../types/response/base/Result';

class BaseClient {
    private prefix: string;

    constructor(prefix: string) {
        this.prefix = prefix;
    }

    get<T = any>(url: string, config?: any): Promise<Result<T>> {
        return http.get(`${this.prefix}${url}`, config);
    }

    post<T = any>(url: string, data?: any, config?: any): Promise<Result<T>> {
        return http.post(`${this.prefix}${url}`, data, config);
    }

    put<T = any>(url: string, data?: any, config?: any): Promise<Result<T>> {
        return http.put(`${this.prefix}${url}`, data, config);
    }

    delete<T = any>(url: string, config?: any): Promise<Result<T>> {
        return http.delete(`${this.prefix}${url}`, config);
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