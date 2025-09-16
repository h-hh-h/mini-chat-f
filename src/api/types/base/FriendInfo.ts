/**
* 好友信息
*/
export class FriendInfo {
    /**
    * 好友ID
    */
    'userId'?: string;
    /**
    * 好友账号
    */
    'account'?: string;
    /**
    * 好友昵称
    */
    'name'?: string;
    /**
    * 好友头像
    */
    'avatar'?: string;
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
        return FriendInfo.attributeTypeMap;
    }

    public constructor() {
    }
}
