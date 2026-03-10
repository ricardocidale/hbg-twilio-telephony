# Twilio Telephony & SMS — Complete Integration Reference

## Purpose
Marcela (the AI assistant) is accessible via three channels: web widget, phone calls, and SMS. This skill documents the full Twilio integration: voice webhooks, WebSocket Media Streams, audio encoding pipeline, SMS handling, admin configuration, and the ElevenLabs phone number management API.

## Sub-Skills
| File | What It Covers |
|------|---------------|
| `voice-pipeline.md` | WebSocket Media Stream protocol, chunk timing, silence detection, audio processing flow, TTS streaming |
| `sms-pipeline.md` | Inbound SMS webhook, LLM processing, reply formatting, segment calculation, message splitting |
| `admin-config.md` | Schema columns, admin API endpoints, TelephonySettings UI component, test SMS |
| `twilio-console-setup.md` | Twilio Console webhook configuration, Replit connector credentials |
| `elevenlabs-phone-api.md` | ElevenLabs phone number management, batch calls, dynamic variables, conversation initiation webhooks |
| `audio-encoding.md` | Format specs table, buffer size formulas, pipeline chains, mulaw/PCM algorithms, G.711 constants + segment table |

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                     Twilio Cloud                          │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐                 │
│  │ Inbound  │  │  Media   │  │ Inbound │                 │
│  │  Voice   │  │  Stream  │  │   SMS   │                 │
│  └────┬─────┘  └────┬─────┘  └────┬────┘                 │
└───────┼──────────────┼────────────┼──────────────────────┘
        │ POST         │ WSS        │ POST
        ▼              ▼            ▼
┌───────────────────────────────────────────────────────────┐
│                    Our Server                              │
│  /api/twilio/        /api/twilio/     /api/twilio/        │
│  voice/incoming      voice/stream     sms/incoming        │
│       │                   │                │              │
│       │ TwiML             │ Audio          │ LLM          │
│       │ <Say>+<Stream>    │ Pipeline       │ Pipeline     │
│       │                   │                │              │
│       │              ┌────┴────┐      ┌────┴────┐        │
│       │              │ mulaw→  │      │ OpenAI  │        │
│       │              │ WAV→STT │      │ Chat    │        │
│       │              │ →LLM→   │      │ →Reply  │        │
│       │              │ TTS→    │      └─────────┘        │
│       │              │ mulaw   │                          │
│       │              └─────────┘                          │
│  ElevenLabs STT/TTS    OpenAI LLM    Chat Storage        │
└───────────────────────────────────────────────────────────┘
```

## Key Files
| File | Purpose |
|------|---------|
| `server/routes/twilio.ts` | Voice webhook, WebSocket stream handler, SMS webhook |
| `server/integrations/twilio.ts` | Twilio client, phone number retrieval, sendSMS |
| `server/integrations/elevenlabs.ts` | STT, streaming TTS, voice config builder |
| `server/integrations/elevenlabs-audio.ts` | Mulaw↔PCM conversion, WAV builder, downsample, escapeXml, buildSystemPrompt |
| `server/routes/admin/marcela.ts` | `/api/admin/twilio-status`, `/api/admin/send-notification`, voice-settings (includes Twilio toggles) |
| `client/src/components/admin/marcela/TelephonySettings.tsx` | Admin UI — connection status, toggles, webhook URLs, test SMS |
| `client/src/features/ai-agent/hooks/use-agent-settings.ts` | `useTwilioStatus()`, `useSendTestSms()` hooks |
| `client/src/features/ai-agent/types.ts` | `TwilioStatus` interface |

## Channel Routing Matrix

| Channel | Endpoint | Auth | Response | LLM Mode | Voice | DB Channel | File |
|---------|----------|------|----------|----------|-------|------------|------|
| Web text | `POST /api/conversations/:id/messages` | Session cookie | SSE stream | Streaming | No | `web` | `server/replit_integrations/chat/routes.ts` |
| Web voice | `POST /api/conversations/:id/voice` | Session cookie | SSE + audio chunks | Streaming | Yes | `web` | `server/replit_integrations/chat/routes.ts` |
| Phone | `POST /api/twilio/voice/incoming` + `WSS /api/twilio/voice/stream` | Public (caller ID lookup) | TwiML + WebSocket Media Stream | Streaming | Yes | `phone` | `server/routes/twilio.ts` |
| SMS | `POST /api/twilio/sms/incoming` | Public (phone lookup) | TwiML `<Message>` | Non-streaming | No | `sms` | `server/routes/twilio.ts` |

### Admin Endpoints
| Endpoint | Auth | Returns | File |
|----------|------|---------|------|
| `GET /api/admin/twilio-status` | Admin only | `{ connected, phoneNumber, error }` | `server/routes/admin.ts` |
| `POST /api/admin/send-notification` | Admin only | Send test SMS `{ to, message }` | `server/routes/admin.ts` |

## Prompt Composition by Channel

| Channel | Role | Prompt Parts | File |
|---------|------|-------------|------|
| Web text | Admin | `SYSTEM_PROMPT` + `ADMIN_ADDITION` + `contextPrompt(userId)` | `chat/routes.ts` |
| Web text | Other | `SYSTEM_PROMPT` + `contextPrompt(userId)` | `chat/routes.ts` |
| Web voice | Admin | `SYSTEM_PROMPT` + `ADMIN_ADDITION` + `VOICE_ADDITION` + `contextPrompt(userId)` | `chat/routes.ts` |
| Web voice | Other | `SYSTEM_PROMPT` + `VOICE_ADDITION` + `contextPrompt(userId)` | `chat/routes.ts` |
| Phone | Admin | `base_prompt` + `PHONE_ADDITION` + `admin_note` + `contextPrompt(userId)` | `twilio.ts` |
| Phone | Other | `base_prompt` + `PHONE_ADDITION` + `contextPrompt(userId)` | `twilio.ts` |
| Phone | Anonymous | `base_prompt` + `PHONE_ADDITION` + `contextPrompt()` | `twilio.ts` |
| SMS | Admin | `base_prompt` + `SMS_ADDITION` + `admin_note` + `contextPrompt(userId)` | `twilio.ts` |
| SMS | Other | `base_prompt` + `SMS_ADDITION` + `contextPrompt(userId)` | `twilio.ts` |
| SMS | Anonymous | `base_prompt` + `SMS_ADDITION` + `contextPrompt()` | `twilio.ts` |

### Prompt Size Estimates
| Part | ~Chars | Notes |
|------|--------|-------|
| `SYSTEM_PROMPT` | 3,500 | Full platform knowledge, 120+ lines |
| `base_prompt` | 400 | Persona + no-LLM-calc rule only |
| `ADMIN_ADDITION` | 1,200 | Admin capabilities |
| `VOICE_ADDITION` | 500 | Concise speech rules |
| `PHONE_ADDITION` | 400 | 1-3 sentence rule |
| `SMS_ADDITION` | 350 | 300-char target rule |
| `contextPrompt` | 500–3,000 | Varies by portfolio size |

### Context Data Sources
| Channel | Includes |
|---------|----------|
| Web | Global assumptions, properties, team members, AI research reports |
| Phone/SMS | Global assumptions, properties (lighter — no team or research) |

## Quick Reference

### Public API Paths (bypass auth)
These paths are added to `PUBLIC_API_PATHS` in `server/index.ts`:
```typescript
"/api/twilio/voice/incoming",
"/api/twilio/voice/status",
"/api/twilio/sms/incoming",
```

### Twilio Connector Credentials (via Replit)
| Setting | Purpose |
|---------|---------|
| `account_sid` | Twilio Account SID |
| `api_key` | API Key (not Auth Token) |
| `api_key_secret` | API Key Secret |
| `phone_number` | Assigned Twilio phone number |

### DB Schema Fields (global_assumptions)
| Column | Drizzle Field | Type | Default | Purpose |
|--------|---------------|------|---------|---------|
| `marcela_twilio_enabled` | `marcelaTwilioEnabled` | boolean | false | Master toggle for voice calls |
| `marcela_sms_enabled` | `marcelaSmsEnabled` | boolean | false | Master toggle for SMS |
| `marcela_phone_greeting` | `marcelaPhoneGreeting` | text | "Hello, this is Marcela..." | TwiML greeting spoken to callers |

## Related Skills
- `elevenlabs-widget/` — ElevenLabs ConvAI SDK, widget, voice settings, PATCH API
- `marcela-ai/` — Overall Marcela architecture
- `admin/` — Admin panel tab structure
