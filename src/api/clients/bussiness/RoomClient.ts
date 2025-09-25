import BaseClient from '../BaseClient';
import { Result } from '../../types/response/base/Result';
import { GroupCreateReq } from '../../types/request/GroupCreateReq';
import { GroupJoinReq } from '../../types/request/GroupJoinReq';
import { CursorReq } from '../../types/request/CursorReq';
import { GroupCompleteInfo } from '../../types/base/GroupCompleteInfo';
import { RoomSimpleInfo } from '../../types/base/RoomSimpleInfo';
import { CursorResp } from '../../types/response/CursorResp';
import type { MemberInfo } from '../../types/base/MemberInfo';
import type { ChatMsgVo } from '../../types/response/ChatMsgVo';
import type { SingleRoomQueryReq } from '@/api/types/request/SingleRoomQueryReq';
import type { RoomMsgReadReq } from '@/api/types/request/RoomMsgReadReq';
import { HTTP_BASE_URL } from '@/config/appConfig';

class RoomClient extends BaseClient {
    constructor() {
        // 修复：传入正确的 baseURL 而不是空字符串
        super(HTTP_BASE_URL);
    }

    /**
     * 创建群组
     * @param req
     * @return
     */
    createGroup(req?: GroupCreateReq): Promise<Result<GroupCompleteInfo>> {
        return this.post('/api/room/group/create', req);
    }

    /**
     * 获取单聊房间信息
     * @param req
     * @returns
     */
    querySingleRoom(req: SingleRoomQueryReq): Promise<Result<RoomSimpleInfo>> {
        return this.post('/api/room/single', req);
    }

    /**
     * 加入群组
     * @param req
     * @returns
     */
    joinRoom(req?: GroupJoinReq): Promise<Result<GroupCompleteInfo>> {
        return this.post('/api/room/group/join', req);
    }

    /**
     * 获取群组成员列表
     * @param cursorReq
     * @returns
     */
    groupMembers(cursorReq?: CursorReq): Promise<Result<CursorResp<MemberInfo>>> {
        return this.post('/api/room/group/members', cursorReq);
    }

    /**
     * 获取群组信息
     * @param roomId
     * @returns
     */
    groupInfo(roomId?: string): Promise<Result<GroupCompleteInfo>> {
        return this.get('/api/room/groupInfo', { params: { roomId } });
    }

    /**
     * 获取房间消息列表
     * @param cursorReq
     * @returns
     */
    roomMsgList(cursorReq?: CursorReq): Promise<Result<CursorResp<ChatMsgVo>>> {
        return this.post('/api/room/msg', cursorReq);
    }

    /**
     * 获取房间列表
     * @param cursorReq
     * @returns
     */
    roomList(cursorReq?: CursorReq): Promise<Result<CursorResp<RoomSimpleInfo>>> {
        return this.post('/api/room/list', cursorReq);
    }

    /**
     * 房间消息已读上报
     * @param roomMsgRead
     * @returns
     */
    readMsg(roomMsgRead?: RoomMsgReadReq): Promise<Result<null>> {
        return this.put('/api/room/msg/read', roomMsgRead);
    }
}
export default new RoomClient();