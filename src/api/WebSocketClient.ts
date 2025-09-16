import { ChatMsgVo } from './types/response/ChatMsgVo';
import { Result } from './types/response/base/Result';
import SessionManager from './SessionManager';

class WebSocketClient {
    private ws: WebSocket | null = null;
    private url: string;
    private reconnectInterval = 5000;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private isConnected = false;
    private messageHandlers: Array<(data: ChatMsgVo) => void> = [];
    private openHandlers: Array<() => void> = [];
    private closeHandlers: Array<() => void> = [];
    private errorHandlers: Array<(error: Event) => void> = [];
    private heartbeatInterval: number = 30000; // 30秒心跳间隔
    private heartbeatTimer: any = null;
    private pongTimeout: number = 5000; // 5秒内未收到pong则认为连接已断开
    private pongTimeoutTimer: any = null;

    constructor(url: string) {
        this.url = url;
    }

    connect(): void {
        try {
            // Get token from session storage
            const token = SessionManager.getCurrentSessionData('token');
            if (!token) {
                console.error('No authentication token found');
                return;
            }

            // Create WebSocket connection with token in query parameter
            this.ws = new WebSocket(`${this.url}?token=${token}`);

            this.ws.onopen = (event: Event) => {
                console.log('WebSocket connection opened:', event);
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.startHeartbeat(); // 连接成功后开始心跳
                this.openHandlers.forEach(handler => handler());
            };

            this.ws.onmessage = (event: MessageEvent) => {
                try {
                    const data = JSON.parse(event.data);
                    // 检查是否是pong响应
                    if (data.type === 'PONG') {
                        console.log('Received PONG from server');
                        // 清除pong超时定时器
                        if (this.pongTimeoutTimer) {
                            clearTimeout(this.pongTimeoutTimer);
                        }
                        return;
                    }

                    // 处理普通消息
                    if (data.type === 'MESSAGE') {
                        const result: ChatMsgVo = data.data;
                        console.log('Received message...........:', result);
                        this.messageHandlers.forEach(handler => handler(result));
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            this.ws.onclose = (event: CloseEvent) => {
                console.log('WebSocket connection closed:', event);
                this.stopHeartbeat(); // 连接关闭时停止心跳
                this.isConnected = false;
                this.closeHandlers.forEach(handler => handler());

                // Attempt to reconnect if not explicitly closed
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    setTimeout(() => {
                        console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                        this.connect();
                    }, this.reconnectInterval);
                }
            };

            this.ws.onerror = (error: Event) => {
                console.error('WebSocket error:', error);
                this.stopHeartbeat(); // 出错时停止心跳
                this.errorHandlers.forEach(handler => handler(error));
            };
        } catch (error) {
            console.error('Error establishing WebSocket connection:', error);
        }
    }

    // 开始心跳
    private startHeartbeat(): void {
        this.stopHeartbeat(); // 先清除之前的心跳定时器

        this.heartbeatTimer = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                // 发送ping消息
                this.ws.send(JSON.stringify({ type: 'PING' }));
                console.log('Sent PING to server');

                // 设置pong超时定时器
                this.pongTimeoutTimer = setTimeout(() => {
                    console.error('Pong timeout, closing connection');
                    this.disconnect(); // 如果超时未收到pong，则断开连接
                }, this.pongTimeout);
            }
        }, this.heartbeatInterval);
    }

    // 停止心跳
    private stopHeartbeat(): void {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }

        if (this.pongTimeoutTimer) {
            clearTimeout(this.pongTimeoutTimer);
            this.pongTimeoutTimer = null;
        }
    }

    disconnect(): void {
        this.stopHeartbeat(); // 断开连接时停止心跳
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
    }

    onMessage(handler: (data: ChatMsgVo) => void): void {
        this.messageHandlers.push(handler);
    }

    onOpen(handler: () => void): void {
        this.openHandlers.push(handler);
    }

    onClose(handler: () => void): void {
        this.closeHandlers.push(handler);
    }

    onError(handler: (error: Event) => void): void {
        this.errorHandlers.push(handler);
    }

    isConnectedStatus(): boolean {
        return this.isConnected;
    }
}

export default WebSocketClient;