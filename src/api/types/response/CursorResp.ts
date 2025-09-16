/**
* 游标查询响应
*/
export class CursorResp<T> {
    /**
    * 数据列表
    */
    'data'?: Array<T>;
    /**
    * 游标值，下一次查询时携带
    */
    'cursor'?: string;
    /**
    * 是否是最后一页
    */
    'last'?: boolean;

    static readonly discriminator: string | undefined = undefined;

    static readonly mapping: {[index: string]: string} | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "data",
            "baseName": "data",
            "type": "Array<ChatMsgVo>",
            "format": ""
        },
        {
            "name": "cursor",
            "baseName": "cursor",
            "type": "string",
            "format": ""
        },
        {
            "name": "last",
            "baseName": "last",
            "type": "boolean",
            "format": ""
        }    ];

    static getAttributeTypeMap() {
        return CursorResp.attributeTypeMap;
    }

    public constructor() {
    }
}
