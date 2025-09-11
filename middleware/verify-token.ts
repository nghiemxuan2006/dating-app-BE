import jwt from "jsonwebtoken"
import { extractToken } from "../utils/token"
export default async (req: any, res: any, next: any) => {
    const accessToken = extractToken(req.header('Token'))
    if (!accessToken) {
        res.status(400).json({
            message: "Bad Request:  No token provided"
        })
    }
    if (accessToken) {
        try {
            const data = jwt.verify(accessToken, process.env.JWT_SECRET_KEY)
            req.data = data
            next()
        } catch (err) {
            if (err && err.name == "TokenExpiredError") {
                res.status(401).json({
                    message: "Unauthorized: Token expired"
                })
            } else {
                res.status(500).json({ err })
            }
        }
    }
}


