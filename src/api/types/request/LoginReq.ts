/**
* 用户登录请求
*/
export class LoginReq {
    /**
    * 账号
    */
    'account'?: string;
    /**
    * 密码
    */
    'password'?: string;
    /**
    * 手机号码
    */
    'phone'?: string;
    /**
    * 手机验证码
    */
    'phoneCode'?: string;
    /**
    * 邮箱
    */
    'email'?: string;
    /**
    * 邮箱验证码
    */
    'emailCode'?: string;

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
            "name": "password",
            "baseName": "password",
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
            "name": "phoneCode",
            "baseName": "phoneCode",
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
            "name": "emailCode",
            "baseName": "emailCode",
            "type": "string",
            "format": ""
        }    ];

    static getAttributeTypeMap() {
        return LoginReq.attributeTypeMap;
    }

    public constructor() {
    }
}
