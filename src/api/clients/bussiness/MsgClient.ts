import BaseClient from '../BaseClient';
import { Result } from '../../types/response/base/Result';
import { ChatCommendReq } from '../../types/request/ChatCommendReq';
import { ChatMsgPollReq } from '../../types/request/ChatMsgPollReq';
import { ChatAckVo } from '../../types/response/ChatAckVo';
import { ChatMsgVo } from '../../types/response/ChatMsgVo';
import { HTTP_BASE_URL } from '@/config/appConfig';

class MsgClient extends BaseClient {
    constructor() {
        super(HTTP_BASE_URL);
    }

    /**
     * 发送消息
     * @param chatCommendReq
     * @returns
     */
    sendMsg(chatCommendReq?: ChatCommendReq): Promise<Result<ChatAckVo>> {
        return this.post('/api/msg/send', chatCommendReq);
    }

    /**
     * 拉取消息
     * @param pollReq
     * @returns
     */
    pollMsg(pollReq?: ChatMsgPollReq): Promise<Result<ChatMsgVo[]>> {
        return this.post('/api/msg/poll', pollReq);
    }
}

export default new MsgClient();
