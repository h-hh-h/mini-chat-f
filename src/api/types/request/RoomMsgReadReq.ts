/**
 * 房间消息已读上报请求
 */
export class RoomMsgReadReq {
    /**
     * 房间ID
     */
    'roomId': string;
    /**
     * 消息id
    */
    'msgId': string;

    public constructor(){
    }
}