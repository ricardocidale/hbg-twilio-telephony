# Twilio Console Setup & Replit Connector

## Replit Connector Configuration

Twilio credentials are managed via the Replit Twilio integration connector. The connector provides:

| Credential | Purpose |
|------------|---------|
| `account_sid` | Twilio Account SID |
| `api_key` | Twilio API Key (not the Auth Token) |
| `api_key_secret` | API Key Secret |
| `phone_number` | Assigned Twilio phone number |

### How Credentials Are Fetched
```typescript
const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
const response = await fetch(
  `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=twilio`,
  { headers: { 'X_REPLIT_TOKEN': token } }
);
const settings = response.items[0].settings;
```

The token uses either `REPL_IDENTITY` (development) or `WEB_REPL_RENEWAL` (deployment).

## Twilio Console Configuration

### Step 1: Get Your Webhook URLs
In the Admin > AI Agent > Telephony panel, the webhook URLs are displayed:
- **Voice**: `https://{your-domain}/api/twilio/voice/incoming`
- **SMS**: `https://{your-domain}/api/twilio/sms/incoming`

### Step 2: Configure Phone Number in Twilio Console

1. Go to [Twilio Console → Phone Numbers](https://console.twilio.com/us1/develop/phone-numbers/manage/incoming)
2. Click your phone number
3. Under **Voice & Fax**:
   - "A Call Comes In": **Webhook**, paste voice URL, **HTTP POST**
   - "Status Callback URL": `https://{your-domain}/api/twilio/voice/status`, **HTTP POST**
4. Under **Messaging**:
   - "A Message Comes In": **Webhook**, paste SMS URL, **HTTP POST**
5. Save

### Step 3: Enable in Admin Panel
1. Go to Admin > AI Agent > Telephony & SMS
2. Toggle "Phone Calls" ON
3. Toggle "SMS" ON
4. Customize the phone greeting if desired
5. Save settings

## Important Notes

- Webhook URLs change if the domain changes (e.g., after redeployment to a different URL)
- The Twilio connector uses API Key authentication (not Account SID + Auth Token)
- All three webhook paths (`voice/incoming`, `voice/status`, `sms/incoming`) are in the public API paths list — they bypass our auth middleware since Twilio calls them directly
- The `voice/status` endpoint is a simple 200 OK — no processing
