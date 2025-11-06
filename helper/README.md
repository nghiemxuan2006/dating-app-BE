# ZEGOCLOUD ZIM Server API Helper

This helper wraps the ZIM Server REST APIs with proper signature generation.

## Environment variables

Add these to your `.env` or environment:

- `ZIM_APP_ID`: Your ZEGOCLOUD AppId (number)
- `ZIM_SERVER_SECRET`: Your ZEGOCLOUD Server Secret (string)
- `ZIM_REGION` (optional): Region short code: `sha | hkg | fra | lax | bom | sgp`. Leave empty for the global endpoint.

## Usage

```ts
import { getZIMClient } from '../helper';

const zim = getZIMClient();

// Generic request
const res = await zim.request('SomeAction', { /* query params */ }, 'GET');

// Example: Query users' online status
const statusRes = await zim.queryUsersOnlineStatus(['user_1', 'user_2']);
if (statusRes.Code === 0) {
  console.log(statusRes.Data?.UserStatusList);
} else {
  console.error(statusRes.Code, statusRes.Message);
}
```

## Notes
- Every request carries a fresh signature per docs: `md5(AppId + SignatureNonce + ServerSecret + Timestamp)`.
- For POST requests, common params and `Action` are sent in the query string; complex business parameters go in the JSON body.
- Base URL is chosen by region. Without `ZIM_REGION`, it uses `https://zim-api.zego.im`.
