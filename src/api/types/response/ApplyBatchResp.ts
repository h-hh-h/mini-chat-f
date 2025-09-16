import { FailItem } from '../base/FailItem';


/**
* 批量处理好友申请的响应
*/
export class ApplyBatchResp {
    /**
    * 成功列表
    */
    'successList'?: Array<string>;
    /**
    * 处理列表
    */
    'failList'?: Array<FailItem>;

    static readonly discriminator: string | undefined = undefined;

    static readonly mapping: {[index: string]: string} | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "successList",
            "baseName": "successList",
            "type": "Array<string>",
            "format": ""
        },
        {
            "name": "failList",
            "baseName": "failList",
            "type": "Array<FailItem>",
            "format": ""
        }    ];

    static getAttributeTypeMap() {
        return ApplyBatchResp.attributeTypeMap;
    }

    public constructor() {
    }
}
