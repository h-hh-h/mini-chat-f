/**
* 聊天消息请求
*/
export class ChatCommendReq {
    /**
    * 聊天类型
    */
    'roomType': ChatCommendReqRoomTypeEnum;
    /**
    * 消息类型
    */
    'msgType': ChatCommendReqMsgTypeEnum;
    /**
    * 房间id
    */
    'roomId': string;
    /**
    * 随机数，用于防止重复提交，重复检测窗口：5分钟
    */
    'random': string;
    /**
    * 文本内容
    */
    'content': string;
    /**
    * 文件ID，非文本型消息时存在
    */
    'fileId'?: string;
    /**
    * 额外信息: @用户、引用消息等
    */
    'extra'?: { [key: string]: any; };

    static readonly discriminator: string | undefined = undefined;

    static readonly mapping: {[index: string]: string} | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "roomType",
            "baseName": "roomType",
            "type": "ChatCommendReqRoomTypeEnum",
            "format": ""
        },
        {
            "name": "msgType",
            "baseName": "msgType",
            "type": "ChatCommendReqMsgTypeEnum",
            "format": ""
        },
        {
            "name": "roomId",
            "baseName": "roomId",
            "type": "string",
            "format": ""
        },
        {
            "name": "random",
            "baseName": "random",
            "type": "string",
            "format": ""
        },
        {
            "name": "content",
            "baseName": "content",
            "type": "string",
            "format": ""
        },
        {
            "name": "fileId",
            "baseName": "fileId",
            "type": "string",
            "format": ""
        },
        {
            "name": "extra",
            "baseName": "extra",
            "type": "{ [key: string]: any; }",
            "format": ""
        }    ];

    static getAttributeTypeMap() {
        return ChatCommendReq.attributeTypeMap;
    }

    public constructor() {
    }
}

export enum ChatCommendReqRoomTypeEnum {
    Single = 'SINGLE',
    Group = 'GROUP'
}
export enum ChatCommendReqMsgTypeEnum {
    Text = 'TEXT',
    Image = 'IMAGE',
    Audio = 'AUDIO',
    Video = 'VIDEO',
    File = 'FILE'
}

