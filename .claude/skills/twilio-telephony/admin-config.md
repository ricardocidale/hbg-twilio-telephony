# Admin Configuration — Twilio Telephony & SMS

## Schema Fields (global_assumptions)

| Column | Drizzle Field | Type | Default | Purpose |
|--------|---------------|------|---------|---------|
| `marcela_twilio_enabled` | `marcelaTwilioEnabled` | boolean | `false` | Master toggle for inbound voice calls |
| `marcela_sms_enabled` | `marcelaSmsEnabled` | boolean | `false` | Master toggle for inbound SMS |
| `marcela_phone_greeting` | `marcelaPhoneGreeting` | text | "Hello, this is Marcela..." | TwiML `<Say>` greeting spoken to callers |

These fields are read/written via `GET/POST /api/admin/voice-settings` alongside voice configuration fields.

## Admin API Endpoints

### `GET /api/admin/twilio-status`
- **Auth**: Admin only
- **Response**: `{ connected: boolean, phoneNumber: string | null, error?: string }`
- **Implementation**: Calls `getTwilioStatus()` which fetches credentials from Replit connector

### `POST /api/admin/send-notification`
- **Auth**: Admin only
- **Body**: `{ to: string, message: string }`
- **Response**: `{ success: boolean, sid?: string, error?: string }`
- **Implementation**: Calls `sendSMS(to, message)` from `server/integrations/twilio.ts`

### `GET /api/admin/voice-settings`
Returns all voice + telephony settings from global_assumptions, including:
- `marcelaTwilioEnabled`, `marcelaSmsEnabled`, `marcelaPhoneGreeting`
- (plus all voice/TTS/STT settings — see `elevenlabs-widget/SKILL.md`)

### `POST /api/admin/voice-settings`
Saves voice + telephony settings to DB. Accepts the same fields as GET returns.

## Client Hooks — `client/src/features/ai-agent/hooks/use-agent-settings.ts`

### `useTwilioStatus()`
```typescript
useQuery<TwilioStatus>({
  queryKey: AI_AGENT_KEYS.twilioStatus,
  queryFn: () => apiRequest("GET", "/api/admin/twilio-status").then(r => r.json()),
});
```

### `useSendTestSms()`
```typescript
useMutation({
  mutationFn: ({ to, message }) => apiRequest("POST", "/api/admin/send-notification", { to, message }),
});
```

## TypeScript Interface — `TwilioStatus`
```typescript
interface TwilioStatus {
  connected: boolean;
  phoneNumber: string | null;
  error?: string;
}
```

## UI Component — `TelephonySettings.tsx`

**Location**: `client/src/components/admin/marcela/TelephonySettings.tsx`

**Props**:
```typescript
interface TelephonySettingsProps {
  draft: VoiceSettings;
  updateField: <K extends keyof VoiceSettings>(key: K, value: VoiceSettings[K]) => void;
  twilioStatus?: TwilioStatus;
}
```

**UI Sections**:

1. **Connection Status** — Badge showing "Connected" (green) or "Not Connected" (red)
2. **Phone Number Display** — Shows Twilio phone number from connector (mono font)
3. **Not Connected Warning** — Amber alert when Twilio connector not configured
4. **Phone Calls Toggle** — Switch for `marcelaTwilioEnabled`
5. **SMS Toggle** — Switch for `marcelaSmsEnabled`
6. **Phone Greeting** — Textarea for `marcelaPhoneGreeting`
7. **Webhook URLs** — Auto-computed from `window.location.origin`, with copy buttons:
   - Voice: `{origin}/api/twilio/voice/incoming`
   - SMS: `{origin}/api/twilio/sms/incoming`
8. **External Link** — Opens Twilio Console phone numbers page
9. **Test SMS** — Phone number input + message textarea + send button (only shown when connected)

**Icons**: Phone, CheckCircle2, XCircle, MessageCircle, ExternalLink, Copy, Send, Loader2 (from lucide-react)
