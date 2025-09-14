import { addWaitingUser } from '../services/waiting-user.service';
import { BAD_REQUEST_ERROR } from '../utils/error';

const matching = async (req: any, res: any) => {
    const { userId, profile } = req.body || {};
    if (!userId) {
        throw new BAD_REQUEST_ERROR('userId is required');
    }
    await addWaitingUser({ userId, profile: profile || {} });
    res.json({ message: 'Enqueued for matching' });
}

export {
    matching
}