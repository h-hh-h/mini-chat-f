import BaseClient from '../BaseClient';
import { Result } from '../../types/response/base/Result';
import { ApplyBatchReq } from '../../types/request/ApplyBatchReq';
import { ApplyReq } from '../../types/request/ApplyReq';
import { ApplyBatchResp } from '../../types/response/ApplyBatchResp';
import { ApplyResp } from '../../types/response/ApplyResp';

class ApplyClient extends BaseClient {
    constructor() {
        super('');
    }

    /**
     * 发起好友申请（单个）
     * @param applyReq 
     * @returns 
     */
    applyOne(applyReq?: ApplyReq): Promise<Result<null>> {
        return this.post('/api/friend/apply', applyReq);
    }

    /**
     * 同意好友申请（批量）
     * @param applyBatchReq 
     * @returns 
     */
    agreeApply(applyBatchReq?: ApplyBatchReq): Promise<Result<ApplyBatchResp>> {
        return this.post('/api/friend/apply/agree', applyBatchReq);
    }

    /**
     * 删除好友申请（批量）
     * @param applyBatchReq 
     * @returns 
     */
    deleteApply(applyBatchReq?: ApplyBatchReq): Promise<Result<ApplyBatchResp>> {
        return this.delete('/api/friend/apply', { data: applyBatchReq });
    }

    /**
     *  获取好友申请列表
     * @param type REQUEST-我发起的申请  RECEIVE-我收到的申请
     * @returns 
     */
    listApply(type: 'REQUEST' | 'RECEIVE'): Promise<Result<ApplyResp[]>> {
        return this.get('/api/friend/apply/list', { params: { type } });
    }
}

export default new ApplyClient();
