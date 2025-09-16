/**
* 房间内最近一条消息信息
*/
export class LastMsgInfo {
    /**
    * 消息id
    */
    'msgId'?: string;
    /**
    * 发送者名称
    */
    'senderName'?: string;
    /**
    * 消息类型
    */
    'msgType'?: LastMsgInfoMsgTypeEnum;
    /**
    * 消息文本内容
    */
    'content'?: string;
    /**
    * 发送时间
    */
    'sendTime'?: number;
    /**
    * 发送者是否为本人
    */
    'self'?: boolean;

    static readonly discriminator: string | undefined = undefined;

    static readonly mapping: {[index: string]: string} | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "msgId",
            "baseName": "msgId",
            "type": "string",
            "format": ""
        },
        {
            "name": "senderName",
            "baseName": "senderName",
            "type": "string",
            "format": ""
        },
        {
            "name": "msgType",
            "baseName": "msgType",
            "type": "LastMsgInfoMsgTypeEnum",
            "format": ""
        },
        {
            "name": "content",
            "baseName": "content",
            "type": "string",
            "format": ""
        },
        {
            "name": "sendTime",
            "baseName": "sendTime",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "self",
            "baseName": "self",
            "type": "boolean",
            "format": ""
        }    ];

    static getAttributeTypeMap() {
        return LastMsgInfo.attributeTypeMap;
    }

    public constructor() {
    }
}

export enum LastMsgInfoMsgTypeEnum {
    Text = 'TEXT',
    Image = 'IMAGE',
    Audio = 'AUDIO',
    Video = 'VIDEO',
    File = 'FILE'
}

