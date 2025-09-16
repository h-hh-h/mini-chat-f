/**
* 用户信息VO
*/
export class UserInfoVo {
    /**
    * 用户ID
    */
    'userId'?: string;
    /**
    * 用户账号
    */
    'account'?: string;
    /**
    * 用户昵称
    */
    'nickName'?: string | null;
    /**
    * 用户头像
    */
    'avatar'?: string | null;
    /**
    * 用户手机号
    */
    'phone'?: string | null;
    /**
    * 用户邮箱
    */
    'email'?: string | null;
    /**
    * 用户状态
    */
    'status'?: UserInfoVoStatusEnum;
    /**
    * 创建时间
    */
    'createTime'?: Date;
    /**
    * 更新时间
    */
    'updateTime'?: Date;

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
            "name": "account",
            "baseName": "account",
            "type": "string",
            "format": ""
        },
        {
            "name": "nickName",
            "baseName": "nickName",
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
            "name": "phone",
            "baseName": "phone",
            "type": "string",
            "format": ""
        },
        {
            "name": "email",
            "baseName": "email",
            "type": "string",
            "format": ""
        },
        {
            "name": "status",
            "baseName": "status",
            "type": "UserInfoVoStatusEnum",
            "format": ""
        },
        {
            "name": "createTime",
            "baseName": "createTime",
            "type": "Date",
            "format": "date-time"
        },
        {
            "name": "updateTime",
            "baseName": "updateTime",
            "type": "Date",
            "format": "date-time"
        }    ];

    static getAttributeTypeMap() {
        return UserInfoVo.attributeTypeMap;
    }

    public constructor() {
    }
}

export enum UserInfoVoStatusEnum {
    Normal = 'NORMAL',
    Disabled = 'DISABLED',
    Logout = 'LOGOUT'
}

