export class ChatAckVo {
    'roomId'?: string;
    'senderId'?: string;
    'msgKey'?: string;
    'serverTime'?: number;

    static readonly discriminator: string | undefined = undefined;

    static readonly mapping: {[index: string]: string} | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "roomId",
            "baseName": "roomId",
            "type": "string",
            "format": ""
        },
        {
            "name": "senderId",
            "baseName": "senderId",
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
            "name": "serverTime",
            "baseName": "serverTime",
            "type": "number",
            "format": "int64"
        }    ];

    static getAttributeTypeMap() {
        return ChatAckVo.attributeTypeMap;
    }

    public constructor() {
    }
}
