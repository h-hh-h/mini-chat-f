/**
* 群组创建请求
*/
export class GroupCreateReq {
    /**
    * 群组名称
    */
    'name'?: string;
    /**
    * 群组描述
    */
    'description'?: string;
    /**
    * 群成员id列表
    */
    'memberIds'?: Set<string>;

    static readonly discriminator: string | undefined = undefined;

    static readonly mapping: {[index: string]: string} | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "name",
            "baseName": "name",
            "type": "string",
            "format": ""
        },
        {
            "name": "description",
            "baseName": "description",
            "type": "string",
            "format": ""
        },
        {
            "name": "memberIds",
            "baseName": "memberIds",
            "type": "Set<string>",
            "format": ""
        }    ];

    static getAttributeTypeMap() {
        return GroupCreateReq.attributeTypeMap;
    }

    public constructor() {
    }
}
