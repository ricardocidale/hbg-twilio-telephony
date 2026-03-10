# ElevenLabs Phone Number Management API

## Overview
ElevenLabs provides a native phone number management API for connecting agents directly to telephony. This is an alternative to our custom WebSocket pipeline — it uses ElevenLabs' built-in Twilio integration where ElevenLabs handles the full audio pipeline.

**Note**: Our app currently uses a custom WebSocket pipeline (see `voice-pipeline.md`), not the ElevenLabs native integration. This document covers the ElevenLabs API for reference and potential future migration.

## Phone Number CRUD

### List Phone Numbers
```typescript
const numbers = await client.conversationalAi.phoneNumbers.list();
```

### Register a Phone Number
```typescript
const phoneNumber = await client.conversationalAi.phoneNumbers.create({
  provider: "twilio",
  phoneNumber: "+1234567890",
  label: "Support Line",
  agentId: "agent_id",
});
```

### Assign Agent to Number
```typescript
await client.conversationalAi.phoneNumbers.update("phone_number_id", {
  agentId: "agent_id",
});
```

### Get Phone Number Details
```typescript
const details = await client.conversationalAi.phoneNumbers.get("phone_number_id");
```

### Remove Phone Number
```typescript
await client.conversationalAi.phoneNumbers.delete("phone_number_id");
```

## Providers
| Provider | Description |
|----------|-------------|
| Twilio | Most common, supports voice calls and SMS |
| SIP Trunk | Direct SIP connection for enterprise telephony |
| WhatsApp | WhatsApp Business voice calls |

## Native Twilio Integration

### Direct ElevenLabs Webhook
Set Twilio webhook to ElevenLabs directly (no custom server needed):
```
POST https://api.elevenlabs.io/v1/convai/twilio/inbound_call
```

### Server Proxy Option
```typescript
app.post("/api/twilio/inbound", async (req, res) => {
  const twiml = await client.conversationalAi.twilio.getInboundCallTwiml({
    agentId: "agent_id",
  });
  res.type("text/xml").send(twiml);
});
```

## Outbound Calls

### Get TwiML for Outbound
```typescript
const twiml = await client.conversationalAi.twilio.getOutboundCallTwiml({
  agentId: "agent_id",
});
```

### Make Outbound Call via Twilio SDK
```typescript
const call = await twilioClient.calls.create({
  to: "+1234567890",
  from: "+0987654321",
  twiml: outboundTwiml,
});
```

## Batch Calling

### Schedule Batch Calls
```typescript
const batch = await client.conversationalAi.batchCalls.create({
  agentId: "agent_id",
  calls: [
    { phoneNumber: "+1234567890", dynamicVariables: { name: "John" } },
    { phoneNumber: "+0987654321", dynamicVariables: { name: "Jane" } },
  ],
});
```

### List Batch Jobs
```typescript
const batches = await client.conversationalAi.batchCalls.list({ agentId: "agent_id" });
```

### Get Batch Status
```typescript
const status = await client.conversationalAi.batchCalls.get("batch_call_id");
```

## Dynamic Variables for Phone

Automatically set by ElevenLabs for phone calls:
- `{{system__caller_id}}` — Caller's phone number
- `{{system__called_number}}` — The number that was called

Use these in the agent's system prompt or tools for personalization.

## Conversation Initiation Webhook

Look up caller info before the conversation starts:

```typescript
app.post("/api/elevenlabs/init", async (req, res) => {
  const callerId = req.body.dynamic_variables?.system__caller_id;
  const customer = await lookupCustomer(callerId);

  res.json({
    dynamic_variables: {
      customer_name: customer.name,
      account_status: customer.status,
    },
  });
});
```

Configure the webhook URL in agent settings → Advanced → Conversation Initiation Webhook.

## Audio Format for Twilio
For Twilio integration, use mulaw 8kHz:
```typescript
const audio = await client.textToSpeech.convert("VOICE_ID", {
  text: "Hello",
  outputFormat: "ulaw_8000",
});
```

## Helper Functions
Available in `.claude/skills/elevenlabs/helpers/phone-numbers.ts`:
- `listPhoneNumbers(client?)`
- `getPhoneNumber(phoneNumberId, client?)`
- `registerPhoneNumber(config, client?)`
- `assignAgentToNumber(phoneNumberId, agentId, client?)`
- `removePhoneNumber(phoneNumberId, client?)`
- `scheduleBatchCalls(agentId, calls, client?)`
- `getBatchCallStatus(batchCallId, client?)`

## Custom vs Native Integration Comparison

| Aspect | Our Custom Pipeline | ElevenLabs Native |
|--------|-------------------|-------------------|
| Audio handling | Our server (mulaw↔PCM) | ElevenLabs handles |
| LLM | OpenAI (our choice) | ElevenLabs-managed (agent LLM) |
| Latency | Higher (double hop) | Lower (direct) |
| Control | Full control over pipeline | Less control |
| Features | Custom RAG, portfolio context | Dashboard-managed |
| Conversation storage | Our DB | ElevenLabs + webhook |
