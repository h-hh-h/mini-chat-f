import BaseClient from '../BaseClient';
import { Result } from '../../types/response/base/Result';
import { UserInfoVo } from '../../types/request/UserInfoVo';

class UserClient extends BaseClient {
    constructor() {
        super('');
    }

    /**
     * 获取用户信息
     * @returns
     */
    userInfo(): Promise<Result<UserInfoVo>> {
        return this.get('/api/user/info');
    }

    /**
     * 搜索用户
     * @param target
     * @returns
     */
    searchUser(target: string): Promise<Result<UserInfoVo>> {
        return this.get('/api/user/search', { params: { target } });
    }
}

export default new UserClient();
