/**
* 群聊成员游标请求
*/
export class CursorReq {
    /**
    * 房间id
    */
    'roomId'?: string;
    /**
    * 游标值
    */
    'cursor'?: string;
    /**
    * 数量
    */
    'size': number;

    static readonly discriminator: string | undefined = undefined;

    static readonly mapping: {[index: string]: string} | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "roomId",
            "baseName": "roomId",
            "type": "string",
            "format": ""
        },
        {
            "name": "cursor",
            "baseName": "cursor",
            "type": "string",
            "format": ""
        },
        {
            "name": "size",
            "baseName": "size",
            "type": "number",
            "format": "int32"
        }    ];

    static getAttributeTypeMap() {
        return CursorReq.attributeTypeMap;
    }

    public constructor() {
    }
}
