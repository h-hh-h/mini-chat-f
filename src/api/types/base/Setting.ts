/**
* 群组设置项
*/
export class Setting {
    /**
    * 是否允许成员邀请其他人
    */
    'allowMemberInvite'?: boolean;
    /**
    * 是否全体禁言
    */
    'muteAll'?: boolean;
    /**
    * 是否需要管理员审批加入
    */
    'needApproval'?: boolean;

    static readonly discriminator: string | undefined = undefined;

    static readonly mapping: {[index: string]: string} | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "allowMemberInvite",
            "baseName": "allowMemberInvite",
            "type": "boolean",
            "format": ""
        },
        {
            "name": "muteAll",
            "baseName": "muteAll",
            "type": "boolean",
            "format": ""
        },
        {
            "name": "needApproval",
            "baseName": "needApproval",
            "type": "boolean",
            "format": ""
        }    ];

    static getAttributeTypeMap() {
        return Setting.attributeTypeMap;
    }

    public constructor() {
    }
}
