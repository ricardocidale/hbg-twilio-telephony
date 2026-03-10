export function mulaw2linear(mulawByte: number): number {
  mulawByte = ~mulawByte & 0xFF;
  const sign = mulawByte & 0x80;
  const exponent = (mulawByte >> 4) & 0x07;
  const mantissa = mulawByte & 0x0F;
  let sample = (mantissa << (exponent + 3)) + (1 << (exponent + 3)) - 132;
  if (sign !== 0) sample = -sample;
  return sample;
}

export function linear2mulaw(sample: number): number {
  const BIAS = 132;
  const CLIP = 32635;
  const sign = (sample >> 8) & 0x80;
  if (sign !== 0) sample = -sample;
  if (sample > CLIP) sample = CLIP;
  sample += BIAS;

  let exponent = 7;
  const expMask = 0x4000;
  for (let i = 0; i < 8; i++) {
    if ((sample & expMask) !== 0) break;
    exponent--;
    sample <<= 1;
  }

  const mantissa = (sample >> 10) & 0x0F;
  const mulawByte = ~(sign | (exponent << 4) | mantissa) & 0xFF;
  return mulawByte;
}

export function mulawBufferToWav(mulawData: Buffer): Buffer {
  const numSamples = mulawData.length;
  const pcmData = Buffer.alloc(numSamples * 2);
  for (let i = 0; i < numSamples; i++) {
    const sample = mulaw2linear(mulawData[i]);
    pcmData.writeInt16LE(sample, i * 2);
  }

  const headerSize = 44;
  const dataSize = pcmData.length;
  const header = Buffer.alloc(headerSize);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(8000, 24);
  header.writeUInt32LE(16000, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmData]);
}

export function pcm16ToMulaw(pcmBase64: string): Buffer {
  const pcmBuffer = Buffer.from(pcmBase64, "base64");
  const numSamples = pcmBuffer.length / 2;
  const mulawBuffer = Buffer.alloc(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const sample = pcmBuffer.readInt16LE(i * 2);
    mulawBuffer[i] = linear2mulaw(sample);
  }
  return mulawBuffer;
}

export function downsample(pcmBase64: string, fromRate: number, toRate: number): Buffer {
  const pcmBuffer = Buffer.from(pcmBase64, "base64");
  const ratio = fromRate / toRate;
  const inputSamples = pcmBuffer.length / 2;
  const outputSamples = Math.floor(inputSamples / ratio);
  const output = Buffer.alloc(outputSamples * 2);
  for (let i = 0; i < outputSamples; i++) {
    const srcIndex = Math.floor(i * ratio);
    const sample = pcmBuffer.readInt16LE(srcIndex * 2);
    output.writeInt16LE(sample, i * 2);
  }
  return output;
}

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export type TelephonyChannel = "phone" | "sms";

const PHONE_SYSTEM_PROMPT_ADDITION = `

## Phone Conversation Mode
You are currently speaking on a phone call via Twilio. Adjust your responses accordingly:
- Keep responses very concise — aim for 1-3 sentences maximum
- Speak naturally as if on a phone — no markdown, no formatting
- Numbers should be spoken naturally ("two hundred fifty thousand dollars" not "$250,000")
- Avoid lists or complex structures — summarize succinctly
- Use casual phone-friendly transitions: "Sure," "Absolutely," "Let me tell you,"
- If you need to give detailed info, offer to send it via text message instead`;

const SMS_SYSTEM_PROMPT_ADDITION = `

## SMS Conversation Mode
You are responding via text message (SMS). Adjust your responses accordingly:
- Keep responses under 300 characters when possible — SMS should be brief
- No markdown formatting — plain text only
- Be direct and actionable
- Use abbreviations sparingly but accept them from the user
- If the question requires a long answer, give the key point and offer to discuss on a call or the web portal`;

const BASE_MARCELA_PROMPT = `You are Marcela, a brilliant hospitality business strategist for Hospitality Business Group. You are warm, confident, and sharp — a trusted advisor. You have deep expertise in hotel acquisitions, revenue management, financial projections, and market analysis.

## CRITICAL: No LLM Calculations
- NEVER perform financial calculations yourself
- ALL calculations must be performed by the platform's coded financial engine
- Direct users to the web portal for computed results`;

export function buildSystemPrompt(channel: TelephonyChannel, isAdmin: boolean): string {
  let prompt = BASE_MARCELA_PROMPT;
  if (channel === "phone") prompt += PHONE_SYSTEM_PROMPT_ADDITION;
  if (channel === "sms") prompt += SMS_SYSTEM_PROMPT_ADDITION;
  if (isAdmin) {
    prompt += `\n\n## Admin Note\nThis user is an administrator with full system access. You can discuss user management, verification, and system configuration.`;
  }
  return prompt;
}
