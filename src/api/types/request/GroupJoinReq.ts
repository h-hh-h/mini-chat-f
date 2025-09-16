/**
* 群聊加入请求
*/
export class GroupJoinReq {
    /**
    * 群聊ID
    */
    'groupId': string;
    /**
    * 邀请人ID
    */
    'inviterId'?: string;
    /**
    * 在群组中的昵称
    */
    'memberName'?: string;

    static readonly discriminator: string | undefined = undefined;

    static readonly mapping: {[index: string]: string} | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "groupId",
            "baseName": "groupId",
            "type": "string",
            "format": ""
        },
        {
            "name": "inviterId",
            "baseName": "inviterId",
            "type": "string",
            "format": ""
        },
        {
            "name": "memberName",
            "baseName": "memberName",
            "type": "string",
            "format": ""
        }    ];

    static getAttributeTypeMap() {
        return GroupJoinReq.attributeTypeMap;
    }

    public constructor() {
    }
}
