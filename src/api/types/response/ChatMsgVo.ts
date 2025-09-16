export class ChatMsgVo {
    'msgId'?: string;
    'msgKey'?: string;
    'msgSeq'?: number;
    'msgType'?: ChatMsgVoMsgTypeEnum;
    'roomId'?: string;
    'roomType'?: ChatMsgVoRoomTypeEnum;
    'senderId'?: string;
    'content'?: string;
    'extra'?: any;
    'serverTime'?: number;
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
            "name": "msgKey",
            "baseName": "msgKey",
            "type": "string",
            "format": ""
        },
        {
            "name": "msgSeq",
            "baseName": "msgSeq",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "msgType",
            "baseName": "msgType",
            "type": "ChatMsgVoMsgTypeEnum",
            "format": ""
        },
        {
            "name": "roomId",
            "baseName": "roomId",
            "type": "string",
            "format": ""
        },
        {
            "name": "roomType",
            "baseName": "roomType",
            "type": "ChatMsgVoRoomTypeEnum",
            "format": ""
        },
        {
            "name": "senderId",
            "baseName": "senderId",
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
            "name": "extra",
            "baseName": "extra",
            "type": "any",
            "format": ""
        },
        {
            "name": "serverTime",
            "baseName": "serverTime",
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
        return ChatMsgVo.attributeTypeMap;
    }

    public constructor() {
    }
}

export enum ChatMsgVoMsgTypeEnum {
    Text = 'TEXT',
    Image = 'IMAGE',
    Audio = 'AUDIO',
    Video = 'VIDEO',
    File = 'FILE'
}
export enum ChatMsgVoRoomTypeEnum {
    Single = 'SINGLE',
    Group = 'GROUP'
}

