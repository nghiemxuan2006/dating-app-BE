import zimService from "../services/zim.service";
import { BAD_REQUEST_ERROR } from "../utils/error";
import logger from "../utils/wiston-log";

const getConversationList = async (req: any, res: any) => {
    try {
        const userId = req.user.id;
        const conversations = await zimService.getConversationList({ FromUserId: userId });
        res.json(conversations);
    } catch (error) {
        logger.error('Fail to fetch conversation list:', error);
        throw new BAD_REQUEST_ERROR('Fail to fetch conversation list');
    }
}

export {
    getConversationList
}