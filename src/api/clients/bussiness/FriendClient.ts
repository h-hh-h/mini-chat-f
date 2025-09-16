import BaseClient from '../BaseClient';
import { Result } from '../../types/response/base/Result';
import { CheckResp } from '../../types/response/CheckResp';
import { PageResp } from '../../types/response/base/PageResp';
import { FriendInfo } from '../../types/base/FriendInfo';

class FriendClient extends BaseClient {
    constructor() {
        super('');
    }

    checkFriend(friendId: string): Promise<Result<CheckResp>> {
        return this.get('/api/friend/check', { params: { friendId } });
    }

    listFriend(page: number, size: number): Promise<Result<PageResp<FriendInfo>>> {
        return this.get('/api/friend/list', { params: { page, size } });
    }
}

export default new FriendClient();
