/**
* 批量处理的失败项
*/
export class FailItem {
    'applyId'?: string;
    'reason'?: string;

    static readonly discriminator: string | undefined = undefined;

    static readonly mapping: {[index: string]: string} | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "applyId",
            "baseName": "applyId",
            "type": "string",
            "format": ""
        },
        {
            "name": "reason",
            "baseName": "reason",
            "type": "string",
            "format": ""
        }    ];

    static getAttributeTypeMap() {
        return FailItem.attributeTypeMap;
    }

    public constructor() {
    }
}
