export class Result<T> {
    code?: number;
    message?: string;
    data?: T | null;
    timestamp?: number;

    static readonly discriminator: string | undefined = undefined;
    static readonly mapping: { [index: string]: string } | undefined = undefined;

    static readonly attributeTypeMap: Array<{ name: string, baseName: string, type: string, format: string }> = [
        {
            "name": "code",
            "baseName": "code",
            "type": "number",
            "format": "int32"
        },
        {
            "name": "message",
            "baseName": "message",
            "type": "string",
            "format": ""
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "any",
            "format": ""
        },
        {
            "name": "timestamp",
            "baseName": "timestamp",
            "type": "number",
            "format": "int64"
        }
    ];

    static getAttributeTypeMap() {
        return Result.attributeTypeMap;
    }

    public constructor(init?: Partial<Result<T>>) {
        Object.assign(this, init);
    }

    /**
     * 判断请求是否成功
     * @returns 是否成功
     */
    public isSuccess(): boolean {
        console.log('Result code:', this.code);
        return Result.isSuccessCode(this.code);
    }

    /**
     * 获取 data，失败时抛出错误
     * @returns 数据
     * @throws 请求失败或数据为空时抛出错误
     */
    public getDataOrThrow(): T {
        if (!this.isSuccess()) {
            throw new Error(`请求失败: [${this.code}] ${this.message || '未知错误'}`);
        }
        if (this.data === null || this.data === undefined) {
            throw new Error('数据为空');
        }
        return this.data;
    }

    /**
     * 获取 data，失败时返回默认值
     * @param defaultValue 默认值
     * @returns 数据或默认值
     */
    public getDataOrDefault(defaultValue: T): T {
        if (!this.isSuccess() || this.data === null || this.data === undefined) {
            return defaultValue;
        }
        return this.data;
    }

    /**
     * 判断 code 是否成功
     * @param code 状态码
     * @returns 是否成功
     */
    static isSuccessCode(code?: number): boolean {
        // 你可以根据后端约定修改，比如 code === 0 或 code === 1 表示成功
        return code === 10000;
    }

    /**
     * 从 JSON 反序列化
     * @param json JSON 对象
     * @returns 反序列化后的 Result 实例
     */
    static fromJSON<T>(json: any): Result<T> {
        return Object.assign(new Result<T>(), json);
    }
}