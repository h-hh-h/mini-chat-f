import BaseClient from '../BaseClient';
import { Result } from '../../types/response/base/Result';
import { LoginReq } from '../../types/request/LoginReq';
import { LoginResp } from '../../types/response/LoginResp';
import { VerifyCodeReq } from '../../types/request/VerifyCodeReq';
import { AUTH_USER_SERVER_BASE_URL } from '@/config/appConfig';

class AuthClient extends BaseClient {
    constructor() {
        super(AUTH_USER_SERVER_BASE_URL);
    }

    /**
     * 用户登录
     * @param loginReq
     * @returns
     */
    login(loginReq?: LoginReq): Promise<Result<LoginResp>> {
        return this.post('/auth/login', loginReq);
    }

    /**
     * 用户登出
     * @returns
     */
    logout(): Promise<Result<null>> {
        return this.post('/auth/logout');
    }

    /**
     * 用户注册
     * @param loginReq
     * @return
     */
    registry(loginReq?: LoginReq): Promise<Result<LoginResp>> {
        return this.post('/auth/registry', loginReq);
    }

    /**
     * 发送邮箱验证码
     * @param email
     * @returns
     */
    emailCode(email: string): Promise<Result<string>> {
        return this.post('/auth/code/email', null, { params: { email } });
    }

    /**
     * 发送手机验证码
     * @param phone
     * @returns
     */
    phoneCode(phone: string): Promise<Result<string>> {
        return this.post('/auth/code/phone', null, { params: { phone } });
    }

    /**
     * 获取图片验证码
     * @param random
     * @returns
     */
    imageCode(random: number): Promise<Result<string>> {
        return this.post('/auth/code/image', null, { params: { random } });
    }

    /**
     * 验证验证码
     * @param verifyCodeReq
     * @returns
     */
    verifyCode(verifyCodeReq?: VerifyCodeReq): Promise<Result<null>> {
        return this.post('/auth/code/verify', verifyCodeReq);
    }
}

export default new AuthClient();