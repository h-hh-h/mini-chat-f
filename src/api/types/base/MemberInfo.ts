/**
* 成员信息
*/
export class MemberInfo {
    /**
    * 用户id
    */
    'userId'?: string;
    /**
    * 昵称
    */
    'name'?: string;
    /**
    * 用户头像
    */
    'avatar'?: string;
    /**
    * 成员身份
    */
    'identity'?: MemberInfoIdentityEnum;
    /**
    * 最近活跃时间
    */
    'lastActiveTime'?: number;

    static readonly discriminator: string | undefined = undefined;

    static readonly mapping: {[index: string]: string} | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "userId",
            "baseName": "userId",
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
            "name": "avatar",
            "baseName": "avatar",
            "type": "string",
            "format": ""
        },
        {
            "name": "identity",
            "baseName": "identity",
            "type": "MemberInfoIdentityEnum",
            "format": ""
        },
        {
            "name": "lastActiveTime",
            "baseName": "lastActiveTime",
            "type": "number",
            "format": "int64"
        }    ];

    static getAttributeTypeMap() {
        return MemberInfo.attributeTypeMap;
    }

    public constructor() {
    }
}

export enum MemberInfoIdentityEnum {
    Owner = 'OWNER',
    Admin = 'ADMIN',
    Member = 'MEMBER'
}

