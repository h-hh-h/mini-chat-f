// 会话管理器，支持同一浏览器中多个用户登录
class SessionManager {
    private static readonly SESSION_KEY_PREFIX = 'mini_chat_session_';
    private static readonly CURRENT_SESSION_KEY = 'current_session_id';
    
    // 生成会话ID
    static generateSessionId(): string {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // 设置当前会话ID
    static setCurrentSessionId(sessionId: string): void {
        sessionStorage.setItem(this.CURRENT_SESSION_KEY, sessionId);
    }
    
    // 获取当前会话ID
    static getCurrentSessionId(): string | null {
        return sessionStorage.getItem(this.CURRENT_SESSION_KEY);
    }
    
    // 保存会话数据
    static saveSessionData(sessionId: string, key: string, data: any): void {
        const sessionKey = this.SESSION_KEY_PREFIX + sessionId;
        let sessionData = sessionStorage.getItem(sessionKey);
        let parsedData = sessionData ? JSON.parse(sessionData) : {};
        
        parsedData[key] = data;
        sessionStorage.setItem(sessionKey, JSON.stringify(parsedData));
    }
    
    // 获取会话数据
    static getSessionData(sessionId: string, key: string): any {
        const sessionKey = this.SESSION_KEY_PREFIX + sessionId;
        const sessionData = sessionStorage.getItem(sessionKey);
        
        if (sessionData) {
            const parsedData = JSON.parse(sessionData);
            return parsedData[key];
        }
        
        return null;
    }
    
    // 获取当前会话数据
    static getCurrentSessionData(key: string): any {
        const sessionId = this.getCurrentSessionId();
        if (sessionId) {
            return this.getSessionData(sessionId, key);
        }
        return null;
    }
    
    // 保存当前会话数据
    static saveCurrentSessionData(key: string, data: any): void {
        const sessionId = this.getCurrentSessionId();
        if (sessionId) {
            this.saveSessionData(sessionId, key, data);
        }
    }
    
    // 清除会话数据
    static clearSessionData(sessionId: string): void {
        const sessionKey = this.SESSION_KEY_PREFIX + sessionId;
        sessionStorage.removeItem(sessionKey);
    }
    
    // 清除当前会话数据
    static clearCurrentSession(): void {
        const sessionId = this.getCurrentSessionId();
        if (sessionId) {
            this.clearSessionData(sessionId);
            sessionStorage.removeItem(this.CURRENT_SESSION_KEY);
        }
    }
    
    // 获取所有会话ID列表
    static getAllSessionIds(): string[] {
        const sessionIds: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith(this.SESSION_KEY_PREFIX)) {
                const sessionId = key.substring(this.SESSION_KEY_PREFIX.length);
                sessionIds.push(sessionId);
            }
        }
        return sessionIds;
    }
}

export default SessionManager;