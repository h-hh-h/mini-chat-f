/**
* 分页响应
*/
export class PageResp<T> {
    /**
    * 分页记录列表
    */
    'records'?: Array<T>;
    /**
    * 总记录数
    */
    'total'?: number;

    static readonly discriminator: string | undefined = undefined;

    static readonly mapping: {[index: string]: string} | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "records",
            "baseName": "records",
            "type": "Array<FriendInfo>",
            "format": ""
        },
        {
            "name": "total",
            "baseName": "total",
            "type": "number",
            "format": "int64"
        }    ];

    static getAttributeTypeMap() {
        return PageResp.attributeTypeMap;
    }

    public constructor() {
    }
}
