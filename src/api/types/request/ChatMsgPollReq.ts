/**
* 房间消息拉取请求
*/
export class ChatMsgPollReq {
    /**
    * 房间类型
    */
    'roomType'?: ChatMsgPollReqRoomTypeEnum;
    /**
    * 房间ID
    */
    'roomId': string;
    /**
    * 开始时间戳
    */
    'startTimestamp'?: number;
    /**
    * 结束时间戳
    */
    'endTimestamp'?: number;

    static readonly discriminator: string | undefined = undefined;

    static readonly mapping: {[index: string]: string} | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "roomType",
            "baseName": "roomType",
            "type": "ChatMsgPollReqRoomTypeEnum",
            "format": ""
        },
        {
            "name": "roomId",
            "baseName": "roomId",
            "type": "string",
            "format": ""
        },
        {
            "name": "startTimestamp",
            "baseName": "startTimestamp",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "endTimestamp",
            "baseName": "endTimestamp",
            "type": "number",
            "format": "int64"
        }    ];

    static getAttributeTypeMap() {
        return ChatMsgPollReq.attributeTypeMap;
    }

    public constructor() {
    }
}

export enum ChatMsgPollReqRoomTypeEnum {
    Single = 'SINGLE',
    Group = 'GROUP'
}

