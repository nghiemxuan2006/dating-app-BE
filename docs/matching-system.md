# Redis Pub/Sub Matching System

This document explains the Redis pub/sub based matching system for the dating app.

## Architecture Overview

The matching system uses Redis pub/sub to handle real-time user matching with the following components:

1. **Client Request** → `/matching` endpoint
2. **Database Query** → Fetches complete user profile (IUserInfo)
3. **Publisher** → Publishes full user info to Redis channel
4. **Subscriber** → Processes matching logic using IUserInfo type
5. **Waiting List** → Redis list for unmatched users with full profiles
6. **Match Results** → Published to separate channel

## Key Features

- **Type Safety**: Uses IUserInfo interface for consistent typing
- **Complete Profiles**: Full user data available for matching algorithm
- **Age Calculation**: Real-time age calculation from birthdate
- **Location Details**: Detailed Vietnamese address structure
- **Comprehensive Scoring**: Multi-factor compatibility algorithm

## System Flow

```
[Client] → [POST /matching] → [Publish to Redis] → [Matching Worker] → [Match Found/Add to Waiting List]
                                      ↓
                              [Match Result Channel] → [Notifications]
```

## API Endpoints

### Submit Matching Request
```http
POST /call/matching
Content-Type: application/json

{
  "userId": "user_account_id"
}
```

**Response:**
```json
{
  "message": "Matching request submitted successfully",
  "userId": "user_account_id",
  "timestamp": 1695384000000
}
```

## Matching Algorithm

The system calculates compatibility scores based on:

1. **Gender Preference Match (30 points)**
   - Both users must match each other's gender preference

2. **Age Compatibility (25 points)**
   - Users must fall within each other's age range preferences

3. **Common Interests (25 points)**
   - Calculated based on shared interests

4. **Location Proximity (20 points)**
   - Closer distance = higher score
   - ≤50km = 20 points
   - ≤100km = 15 points
   - ≤200km = 10 points
   - ≤500km = 5 points

**Minimum Score:** 40 points required for a match

## Redis Channels

### Matching Channel: `user_matching`
**Message Format:**
```json
{
  "userId": "user_account_id",
  "userInfo": {
    "account": "user_account_id",
    "gender": "male",
    "gender_preference": "female",
    "birthdate": "1998-05-15T00:00:00.000Z",
    "age_range": {
      "min": 20,
      "max": 30
    },
    "interests": ["traveling", "music"],
    "location": {
      "type": "Point",
      "coordinates": [105.8542, 21.0285]
    },
    "location_string": "Dao Nguyen, An Khanh, Ha Noi",
    "photos": ["url1", "url2"],
    "createdAt": "2025-09-23T00:00:00.000Z",
    "updatedAt": "2025-09-23T00:00:00.000Z"
  },
  "timestamp": 1695384000000
}
```

### Match Found Channel: `match_found`
**Message Format:**
```json
{
  "user1": "user_account_id_1",
  "user2": "user_account_id_2",
  "compatibility_score": 75,
  "matched_at": 1695384000000
}
```

## Running the System

### 1. Start the Main Server
```bash
npm start
```

### 2. Start the Matching Worker
```bash
npm run matching-worker
```

### 3. Test the System

1. **Generate fake users:**
   ```bash
   npm run generate-data 20
   ```

2. **Submit matching requests:**
   ```bash
   curl -X POST http://localhost:3000/call/matching \
     -H "Content-Type: application/json" \
     -d '{"userId": "user_account_id"}'
   ```

## Environment Variables

Make sure your `.env` file includes:
```
REDIS_HOST=localhost
REDIS_PORT=6379
MONGODB_URI=mongodb://localhost:27017/dating-app
```

## Monitoring and Logging

The system logs the following events:
- Matching requests received
- Compatibility scores calculated
- Matches found
- Users added to waiting list
- Worker status

Example log output:
```
[INFO] Processing matching request for user user123
[INFO] Found 5 waiting users
[INFO] Compatibility score between user123 and user456: 75
[INFO] 🎉 MATCH FOUND! User user123 matched with User user456
[INFO] 💕 Compatibility Score: 75%
```

## Scaling Considerations

1. **Multiple Workers**: You can run multiple matching workers for load balancing
2. **Redis Cluster**: Use Redis cluster for high availability
3. **Database Indexing**: Ensure proper indexes on user profiles
4. **Rate Limiting**: Implement rate limiting on matching requests

## Error Handling

The system handles:
- Invalid user IDs
- Missing user profiles
- Redis connection failures
- Database connection issues
- Malformed messages

All errors are logged with appropriate error levels.

## Future Enhancements

1. **Machine Learning**: Improve matching algorithm with ML models
2. **Real-time Notifications**: WebSocket notifications for matches
3. **Match History**: Store match history in database
4. **Advanced Filters**: More sophisticated filtering options
5. **Batch Processing**: Process multiple matches in batches
6. **A/B Testing**: Test different matching algorithms
