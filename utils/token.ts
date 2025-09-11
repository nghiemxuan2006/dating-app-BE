import jwt from "jsonwebtoken"


function extractToken(authorizationHeader: any) {
    if (!authorizationHeader) return null
    const tokenRegex = /Bearer (.+)/;
    const matches = authorizationHeader.match(tokenRegex);
    if (matches && matches.length === 2) {
        return matches[1];
    }
    return null;
}

const verifyAccessToken = (token: string) => {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY)
    return decoded
}

export { extractToken, verifyAccessToken }