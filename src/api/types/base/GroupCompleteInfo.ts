import { MemberInfo } from './MemberInfo';
import { Setting } from './Setting';

/**
* 群组信息
*/
export class GroupCompleteInfo {
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
    'roomType'?: GroupCompleteInfoRoomTypeEnum;
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
    /**
    * 群主ID
    */
    'ownerId'?: string;
    /**
    * 当前用户在群组中的角色
    */
    'role'?: GroupCompleteInfoRoleEnum;
    /**
    * 当前用户在群组中的状态
    */
    'status'?: GroupCompleteInfoStatusEnum;
    /**
    * 加入时间
    */
    'joinTime'?: number;
    'settings'?: Setting;
    /**
    * 成员展示
    */
    'memberInfos'?: Array<MemberInfo>;

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
            "type": "GroupCompleteInfoRoomTypeEnum",
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
        },
        {
            "name": "ownerId",
            "baseName": "ownerId",
            "type": "string",
            "format": ""
        },
        {
            "name": "role",
            "baseName": "role",
            "type": "GroupCompleteInfoRoleEnum",
            "format": ""
        },
        {
            "name": "status",
            "baseName": "status",
            "type": "GroupCompleteInfoStatusEnum",
            "format": ""
        },
        {
            "name": "joinTime",
            "baseName": "joinTime",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "settings",
            "baseName": "settings",
            "type": "Setting",
            "format": ""
        },
        {
            "name": "memberInfos",
            "baseName": "memberInfos",
            "type": "Array<MemberInfo>",
            "format": ""
        }    ];

    static getAttributeTypeMap() {
        return GroupCompleteInfo.attributeTypeMap;
    }

    public constructor() {
    }
}

export enum GroupCompleteInfoRoomTypeEnum {
    Single = 'SINGLE',
    Group = 'GROUP'
}
export enum GroupCompleteInfoRoleEnum {
    Owner = 'OWNER',
    Admin = 'ADMIN',
    Member = 'MEMBER'
}
export enum GroupCompleteInfoStatusEnum {
    Normal = 'NORMAL',
    Mute = 'MUTE',
    Delete = 'DELETE'
}

