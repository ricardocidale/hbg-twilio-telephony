# Twilio Telephony Sources & References

## Official Documentation

| Resource | URL |
|----------|-----|
| Voice Webhooks | https://www.twilio.com/docs/usage/webhooks/voice-webhooks |
| Webhooks Introduction | https://www.twilio.com/docs/usage/webhooks |
| Getting Started with Webhooks | https://www.twilio.com/docs/usage/webhooks/getting-started-twilio-webhooks |
| Media Streams Overview | https://www.twilio.com/docs/voice/media-streams |
| Media Streams WebSocket Messages | https://www.twilio.com/docs/voice/media-streams/websocket-messages |
| Streams Subresource | https://www.twilio.com/docs/voice/api/stream-resource |
| TwiML Voice: Stream | https://www.twilio.com/docs/voice/twiml/stream |
| Interactive Voice Response | https://www.twilio.com/docs/voice/interactive-voice-response |
| Build IVR Phone Tree | https://www.twilio.com/docs/voice/tutorials/build-interactive-voice-response-ivr-phone-tree |
| Event Streams | https://www.twilio.com/docs/events |

## GitHub Repositories

| Repo | URL | Description |
|------|-----|-------------|
| Media Streams Examples | https://github.com/twilio/media-streams | Official quick start guides for Media Streams |
| Basic IVR Code Exchange | https://www.twilio.com/code-exchange/basic-ivr | IVR template |

## Hospitality Use Cases

| Resource | URL | Description |
|----------|-----|-------------|
| Hospitality Solutions | https://www.twilio.com/en-us/solutions/hospitality | Official hospitality API page |
| Digital Concierge (Flex) | https://www.twilio.com/en-us/flex/use-cases/digital-concierge | Flex-based concierge solution |
| What Is a Digital Concierge | https://www.twilio.com/blog/digital-concierge | Blog: in-app concierge patterns |
| Nivula Case Study | https://customers.twilio.com/en-us/nivula | Hotel guest experiences with Twilio |
| Zingle Case Study | https://customers.twilio.com/en-us/zingle | Real-time customer service for hospitality |
| IVR Solutions | https://www.twilio.com/en-us/use-cases/ivr | Voice menu automation |
| Customer Experience | https://www.twilio.com/en-us/solutions/customer-experience | CX solutions overview |

## Tutorials & Guides

| Resource | URL | Description |
|----------|-----|-------------|
| Consume Media Stream (Python/Flask) | https://www.twilio.com/docs/voice/tutorials/consume-real-time-media-stream-using-websockets-python-and-flask | WebSocket media stream tutorial |
| Conversational IVR Guide | https://www.twilio.com/docs/autopilot/guides/how-build-conversational-ivr | Build conversational IVR |
| IVR Complete Guide | https://www.twilio.com/en-us/resource-center/complete-guide-to-interactive-voice-response | Comprehensive IVR reference |
| OpenAI Realtime + Twilio | https://skywork.ai/blog/agent/openai-realtime-api-twilio-integration-complete-guide/ | Community guide: real-time AI + Twilio |

## Integration with ElevenLabs

This integration uses Twilio Media Streams (bi-directional WebSocket) to pipe call audio through the ElevenLabs audio pipeline:

```
Caller → Twilio → mulaw audio → WebSocket → Server
  Server: mulaw → PCM → WAV → ElevenLabs STT
  Server: LLM response → ElevenLabs TTS → PCM → mulaw
Server → WebSocket → Twilio → Caller
```

See `server/integrations/elevenlabs-audio.ts` for the encoding pipeline and `server/routes/twilio.ts` for the WebSocket handler.

Related repo: [hbg-elevenlabs](https://github.com/ricardocidale/hbg-elevenlabs) — the ElevenLabs ConvAI integration this telephony layer connects to.

## Key Capabilities for Hotels

### What Twilio Voice + SMS Can Do for Hospitality
1. **Inbound Call Handling** — AI-powered voice agent answers calls, greets guests, routes requests
2. **WebSocket Media Streams** — Real-time bi-directional audio for live AI conversations
3. **SMS Concierge** — Guests text the hotel number, AI responds with information and booking help
4. **Multi-Language** — Combined with ElevenLabs, supports 31 languages over phone
5. **Status Callbacks** — Track call outcomes, duration, disposition
6. **Programmable Messaging** — Booking confirmations, check-in reminders, post-stay follow-up
7. **Flex Digital Concierge** — Full omnichannel contact center for hotels

### Twilio in Hospitality (from case studies)
- **Nivula**: Powers guest experiences for hotels, enabling real-time communication
- **Zingle**: Real-time customer service platform used by hotels worldwide
- **IVR**: Automated phone trees for reservations, room service, front desk routing
