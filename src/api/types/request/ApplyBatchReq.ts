/**
* 批量处理好友申请的请求
*/
export class ApplyBatchReq {
    /**
    * 好友申请ID列表
    */
    'applyIds': Array<string>;

    static readonly discriminator: string | undefined = undefined;

    static readonly mapping: {[index: string]: string} | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "applyIds",
            "baseName": "applyIds",
            "type": "Array<string>",
            "format": ""
        }    ];

    static getAttributeTypeMap() {
        return ApplyBatchReq.attributeTypeMap;
    }

    public constructor() {
    }
}
