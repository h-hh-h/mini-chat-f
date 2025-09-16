/**
* 房间简略信息
*/
export class RoomSimpleInfo {
    /**
    * 房间ID
    */
    'roomId'?: string;
    /**
    * 房间名称
    */
    'name'?: string;
    /**
    * 房间类型
    */
    'roomType'?: RoomSimpleInfoRoomTypeEnum;
    /**
    * 房间头像
    */
    'avatar'?: string;
    /**
    * 未读消息数
    */
    'unread'?: number;
    /**
    * 最近一条已读消息内容
    */
    'lastReadMsgId'?: string;
    'lastMsgInfo'?: any;

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
            "name": "name",
            "baseName": "name",
            "type": "string",
            "format": ""
        },
        {
            "name": "roomType",
            "baseName": "roomType",
            "type": "RoomSimpleInfoRoomTypeEnum",
            "format": ""
        },
        {
            "name": "avatar",
            "baseName": "avatar",
            "type": "string",
            "format": ""
        },
        {
            "name": "unread",
            "baseName": "unread",
            "type": "number",
            "format": "int32"
        },
        {
            "name": "lastReadMsgId",
            "baseName": "lastReadMsgId",
            "type": "string",
            "format": ""
        },
        {
            "name": "lastMsgInfo",
            "baseName": "lastMsgInfo",
            "type": "any",
            "format": ""
        }    ];

    static getAttributeTypeMap() {
        return RoomSimpleInfo.attributeTypeMap;
    }

    public constructor() {
    }
}

export enum RoomSimpleInfoRoomTypeEnum {
    Single = 'SINGLE',
    Group = 'GROUP'
}

