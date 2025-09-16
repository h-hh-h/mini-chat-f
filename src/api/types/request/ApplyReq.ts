/**
* 好友申请请求参数
*/
export class ApplyReq {
    /**
    * 好友id
    */
    'friendId': string;
    /**
    * 备注信息
    */
    'remark'?: string;

    static readonly discriminator: string | undefined = undefined;

    static readonly mapping: {[index: string]: string} | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "friendId",
            "baseName": "friendId",
            "type": "string",
            "format": ""
        },
        {
            "name": "remark",
            "baseName": "remark",
            "type": "string",
            "format": ""
        }    ];

    static getAttributeTypeMap() {
        return ApplyReq.attributeTypeMap;
    }

    public constructor() {
    }
}
