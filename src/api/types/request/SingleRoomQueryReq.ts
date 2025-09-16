/**
 * 获取单聊房间请求
 */
export class SingleRoomQueryReq {
    /**
     * 好友ID
     */
    'friendId': string;
    /**
     * 备注名称     */
    'remarkName'?: string;

    public constructor(){
    }
}