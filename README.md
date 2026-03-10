# HBG Twilio Telephony

Complete Twilio voice and SMS integration for the Hospitality Business Group platform. Extends the "Marcela" AI assistant to phone calls and text messages.

## Features

- **Inbound Voice** — TwiML webhook handles incoming calls with ElevenLabs STT/TTS
- **WebSocket Media Streams** — Real-time audio pipeline (mulaw ↔ PCM ↔ WAV)
- **Inbound SMS** — AI-powered responses via OpenAI with message segmenting
- **Admin UI** — Toggle voice/SMS, configure greeting, test SMS, view webhooks
- **Audio Encoding** — Full G.711 mulaw pipeline with format conversion utilities

## Architecture

```
Twilio Cloud
  ├── Inbound Voice → POST /api/twilio/voice/incoming → TwiML + <Stream>
  │                    WSS /api/twilio/voice/stream → mulaw→WAV→STT→LLM→TTS→mulaw
  ├── Status Callback → POST /api/twilio/voice/status
  └── Inbound SMS → POST /api/twilio/sms/incoming → OpenAI → Reply SMS

Server Files:
  server/integrations/twilio.ts          # Twilio client, SMS sending
  server/integrations/elevenlabs-audio.ts # Audio encoding (mulaw/PCM)
  server/routes/twilio.ts                # Webhooks + WebSocket handler

Client Files:
  client/src/components/admin/TwilioTab.tsx
  client/src/components/admin/marcela/TelephonySettings.tsx
```

## Documentation

See the `.claude/skills/twilio-telephony/` directory for detailed sub-skills:
- `voice-pipeline.md` — WebSocket protocol, chunk timing, silence detection
- `sms-pipeline.md` — Inbound webhook, LLM processing, reply formatting
- `admin-config.md` — Schema, API endpoints, UI component
- `twilio-console-setup.md` — Twilio Console webhook configuration
- `elevenlabs-phone-api.md` — ElevenLabs phone number management
- `audio-encoding.md` — Format specs, buffer formulas, mulaw algorithms

## Dependencies

- `twilio` — Twilio SDK
- `@replit/connectors-sdk` — Replit OAuth connector for Twilio credentials
- `openai` — LLM for SMS responses
- ElevenLabs (see hbg-elevenlabs repo) — STT/TTS for voice calls

## Setup

1. Connect Twilio account via Replit Connectors
2. Configure webhook URLs in Twilio Console (see twilio-console-setup.md)
3. Enable Voice and/or SMS in Admin → AI Agent → Twilio
4. Set phone greeting message
