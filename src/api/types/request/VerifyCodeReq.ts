/**
* 校验验证码请求
*/
export class VerifyCodeReq {
    /**
    * 校验的列
    */
    'verify': string;
    /**
    * 验证码
    */
    'code': string;
    /**
    * 验证码类型
    */
    'type': VerifyCodeReqTypeEnum;

    static readonly discriminator: string | undefined = undefined;

    static readonly mapping: {[index: string]: string} | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "verify",
            "baseName": "verify",
            "type": "string",
            "format": ""
        },
        {
            "name": "code",
            "baseName": "code",
            "type": "string",
            "format": ""
        },
        {
            "name": "type",
            "baseName": "type",
            "type": "VerifyCodeReqTypeEnum",
            "format": ""
        }    ];

    static getAttributeTypeMap() {
        return VerifyCodeReq.attributeTypeMap;
    }

    public constructor() {
    }
}

export enum VerifyCodeReqTypeEnum {
    Phone = 'PHONE',
    Email = 'EMAIL',
    Image = 'IMAGE'
}

