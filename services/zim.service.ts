import { getZIMClient, ZIMCommonResponse } from '../helper/zim-api';

export interface DeleteConversationParams {
    // The user who owns the conversation (target user context)
    FromUserId: string;
    // Conversation identifier (for 1-to-1 often equals peer userId; for group equals groupId)
    ConvId: string;
    // 0: 1-to-1, 1: group (convention; adjust if docs differ)
    ConvType: number;
}

export interface DeleteAllMessageParams {
    // The user who wants to clear messages
    FromUserId: string;
    // The peer user or group identifier
    ToUserId: string;
}

export class ZIMService {

    private readonly client: ReturnType<typeof getZIMClient>;

    constructor() {
        this.client = getZIMClient();
    }
    /**
     * Delete a conversation for a specific user.
     * Action name aligns with ZIM Server REST conventions. If your project uses a different
     * action name or requires extra fields, extend DeleteConversationParams accordingly.
     */
    async deleteConversation(params: DeleteConversationParams): Promise<ZIMCommonResponse> {
        // POST: common params + Action in query, business params in JSON body
        return this.client.request('DeleteConv', undefined, 'POST', params);
    }

    async deleteAllMessage(params: DeleteAllMessageParams): Promise<ZIMCommonResponse> {
        return this.client.request('ClearPeerMessage', undefined, 'POST', params);
    }

    async getConversationList(params: { FromUserId: string; Limit?: number; Next?: number; }): Promise<ZIMCommonResponse> {
        return this.client.request('QueryConversationList', undefined, 'POST', params);
    }

}

// Export a singleton for convenience
const zimService = new ZIMService();
export default zimService;
