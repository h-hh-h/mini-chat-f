/**
* 好友申请响应参数
*/
export class ApplyResp {
    /**
    * 账号
    */
    'account'?: string;
    /**
    * 昵称
    */
    'nickName'?: string;
    /**
    * 状态
    */
    'status'?: ApplyRespStatusEnum;
    /**
    * 备注信息
    */
    'remarks'?: string;
    /**
    * 好友申请id
    */
    'applyId'?: string;
    /**
    * 创建时间
    */
    'createTime'?: Date;

    static readonly discriminator: string | undefined = undefined;

    static readonly mapping: {[index: string]: string} | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
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
            "name": "status",
            "baseName": "status",
            "type": "ApplyRespStatusEnum",
            "format": ""
        },
        {
            "name": "remarks",
            "baseName": "remarks",
            "type": "string",
            "format": ""
        },
        {
            "name": "applyId",
            "baseName": "applyId",
            "type": "string",
            "format": ""
        },
        {
            "name": "createTime",
            "baseName": "createTime",
            "type": "Date",
            "format": "date-time"
        }    ];

    static getAttributeTypeMap() {
        return ApplyResp.attributeTypeMap;
    }

    public constructor() {
    }
}

export enum ApplyRespStatusEnum {
    Wait = 'WAIT',
    Agree = 'AGREE',
    Reject = 'REJECT'
}

