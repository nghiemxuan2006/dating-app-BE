import axios, { AxiosInstance, AxiosRequestConfig, Method } from 'axios';
import crypto from 'crypto';
import settings from '../config/env';

export type ZIMRegion = '' | 'sha' | 'hkg' | 'fra' | 'lax' | 'bom' | 'sgp';

export interface ZIMApiClientOptions {
    appId?: number | string;
    serverSecret?: string;
    region?: ZIMRegion; // empty string means use global endpoint
    timeoutMs?: number;
}

export interface ZIMCommonResponse<T = any> {
    Code: number;
    Message: string;
    RequestId: string;
    [key: string]: any;
    Data?: T;
}

/**
 * Build ZIM server API host by region. If region is empty -> global endpoint.
 */
function buildZimApiHost(region: ZIMRegion): string {
    if (!region) return 'zim-api.zego.im';
    return `zim-api-${region}.zego.im`;
}

function generateNonceHex16(): string {
    // 16-character hex string (hex encoding of 8 random bytes)
    return crypto.randomBytes(8).toString('hex');
}

function md5HexLower(input: string): string {
    return crypto.createHash('md5').update(input).digest('hex');
}

export class ZIMApiClient {
    private appId: number;
    private serverSecret: string;
    private region: ZIMRegion;
    private axios: AxiosInstance;

    constructor(opts: ZIMApiClientOptions = {}) {
        const appIdFromEnv = settings.ZIM_APP_ID ? Number(settings.ZIM_APP_ID) : undefined;
        const serverSecretFromEnv = settings.ZIM_SERVER_SECRET || undefined;
        const regionFromEnv = (settings.ZIM_REGION as ZIMRegion) || '';

        if (!opts.appId && !appIdFromEnv) {
            throw new Error('ZIMApiClient: missing AppId. Set ZIM_APP_ID in env or pass via options.');
        }
        if (!opts.serverSecret && !serverSecretFromEnv) {
            throw new Error('ZIMApiClient: missing ServerSecret. Set ZIM_SERVER_SECRET in env or pass via options.');
        }

        this.appId = Number(opts.appId ?? appIdFromEnv);
        this.serverSecret = String(opts.serverSecret ?? serverSecretFromEnv);
        this.region = (opts.region ?? regionFromEnv) as ZIMRegion;

        const baseURL = `https://${buildZimApiHost(this.region)}`;

        this.axios = axios.create({
            baseURL,
            timeout: opts.timeoutMs ?? 10000,
        });
    }

    /**
     * Compute signature per docs: md5(AppId + SignatureNonce + ServerSecret + Timestamp), lower-case hex
     */
    private computeSignature(nonce: string, timestampSec: number): string {
        const data = `${this.appId}${nonce}${this.serverSecret}${timestampSec}`;
        return md5HexLower(data);
    }

    /**
     * Build common params for every request.
     */
    private buildCommonParams() {
        const SignatureNonce = generateNonceHex16();
        const Timestamp = Math.floor(Date.now() / 1000);
        const Signature = this.computeSignature(SignatureNonce, Timestamp);
        return {
            AppId: this.appId,
            Signature,
            SignatureNonce,
            SignatureVersion: '2.0',
            Timestamp,
        } as const;
    }

    /**
     * Low-level request helper. Action is mandatory; extraParams are business params.
     * If method is GET, all params go to query. For POST, common+Action go in query, body in JSON.
     */
    async request<T = any>(
        action: string,
        extraParams?: Record<string, any>,
        method: Method = 'GET',
        body?: any,
        config?: AxiosRequestConfig,
    ): Promise<ZIMCommonResponse<T>> {
        if (!action) throw new Error('ZIMApiClient.request: action is required');

        const common = this.buildCommonParams();

        const queryParams = {
            Action: action,
            ...common,
            ...(extraParams || {}),
        };

        const axiosCfg: AxiosRequestConfig = {
            method,
            url: '/',
            params: method === 'GET' ? queryParams : { Action: action, ...common, ...(extraParams || {}) },
            ...(method !== 'GET' ? { data: body ?? {} } : {}),
            ...config,
            headers: {
                'Content-Type': 'application/json',
                ...(config?.headers || {}),
            },
        };

        const res = await this.axios.request<ZIMCommonResponse<T>>(axiosCfg);
        return res.data;
    }

    // Example high-level wrapper: Query users online status
    // Docs: https://www.zegocloud.com/docs/zim-server/user/query-users-online-status
    async queryUsersOnlineStatus(userIdList: string[]): Promise<ZIMCommonResponse<{ UserStatusList: Array<{ UserId: string; OnlineStatus: number }> }>> {
        const params = {
            UserIdList: userIdList,
        };
        // According to docs, this endpoint is a POST with complex body. Keep common params in query.
        return this.request('QueryUsersOnlineStatus', undefined, 'POST', params);
    }
}

// Singleton helper using env by default
let singleton: ZIMApiClient | null = null;
export function getZIMClient(): ZIMApiClient {
    if (!singleton) singleton = new ZIMApiClient();
    return singleton;
}

export default ZIMApiClient;
