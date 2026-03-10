# SMS Pipeline — Twilio Inbound SMS

## Overview
Inbound SMS messages are processed through OpenAI (non-streaming) and replied via TwiML `<Message>`. Each SMS creates a new conversation with `channel: "sms"`.

## Webhook: `POST /api/twilio/sms/incoming`

### Request Body (from Twilio)
| Field | Description |
|-------|-------------|
| `From` | Sender's phone number (E.164 format) |
| `Body` | SMS message text |
| `To` | Receiving Twilio number |

### Processing Flow

1. **Toggle check**: If `marcelaSmsEnabled === false`, reply with disabled message
2. **Empty body check**: Return empty `<Response>` for blank messages
3. **Caller lookup**: `storage.getUserByPhoneNumber(from)` for identity + role
4. **Create conversation**: `chatStorage.createConversation("SMS: {first 40 chars}", "sms")`
5. **Save user message**: `chatStorage.createMessage(conversationId, "user", body)`
6. **Build context**: Portfolio data + RAG chunks (4 chunks)
7. **System prompt**: `buildSystemPrompt("sms", isAdmin)` — SMS-optimized (concise, no markdown)
8. **LLM call**: OpenAI chat completion (non-streaming, single response)
9. **Save assistant message**: `chatStorage.createMessage(conversationId, "assistant", reply)`
10. **Truncate**: Limit reply to 1500 characters (SMS limit safety margin)
11. **Reply**: TwiML `<Response><Message>{reply}</Message></Response>`

### Response Format
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>{escaped reply text}</Message>
</Response>
```

### LLM Configuration
- **Model**: `ga.marcelaLlmModel` or `"gpt-4.1"` default
- **Max tokens**: `ga.marcelaMaxTokensVoice` or `1024` default
- **Non-streaming**: Single completion (no token streaming needed for text reply)

### Error Handling
On any error, returns: `<Response><Message>Sorry, I encountered an error. Please try again.</Message></Response>`

## SMS Segment Calculation

Twilio charges per segment. Segment sizes depend on character encoding:

| Encoding | Single Segment | Multi-Segment | When Used |
|----------|---------------|---------------|-----------|
| GSM-7 | 160 chars | 153 chars/segment | ASCII, Latin characters |
| UCS-2 | 70 chars | 67 chars/segment | Unicode, emoji |

**Formula:** `if length <= single_limit: 1 segment; else: ceil(length / multi_limit)`

**Our limits:**
- App max reply: **1,500 chars** (truncated before sending)
- Twilio max body: **1,600 chars** (split at word boundaries if exceeded)

## sendSMS Helper — `server/integrations/twilio.ts`

For outbound SMS (admin test messages, notifications):

```typescript
async function sendSMS(to: string, body: string): Promise<{ success: boolean; sid?: string; error?: string }>
```

### Features
- Auto-splits messages longer than 1600 characters at word boundaries
- Uses Twilio client credentials from Replit connector
- Returns message SID on success
- Used by `POST /api/admin/send-notification` endpoint

### Message Splitting Logic
```
if remaining > MAX_SMS_LENGTH (1600):
  split at last space before 1600 chars (lastIndexOf(' ', 1600))
  send segment
  continue with rest
```

## Conversation Persistence
- Each SMS creates a new conversation (no session continuity between SMS messages)
- Title format: `"SMS: {first 40 chars}..."`
- Channel: `"sms"`
- Saved to same `conversations` + `messages` tables as web and phone
