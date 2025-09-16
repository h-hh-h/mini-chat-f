/**
* 好友关系检查响应
*/
export class CheckResp {
    /**
    * 好友关系
    */
    'status'?: CheckRespStatusEnum;

    static readonly discriminator: string | undefined = undefined;

    static readonly mapping: {[index: string]: string} | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "status",
            "baseName": "status",
            "type": "CheckRespStatusEnum",
            "format": ""
        }    ];

    static getAttributeTypeMap() {
        return CheckResp.attributeTypeMap;
    }

    public constructor() {
    }
}

export enum CheckRespStatusEnum {
    Normal = 'NORMAL',
    Blocked = 'BLOCKED',
    Deleted = 'DELETED',
    NotFriend = 'NOT_FRIEND'
}

