import twilio from 'twilio';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=twilio',
    {
      headers: {
        'Accept': 'application/json',
        'X-Replit-Token': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.account_sid || !connectionSettings.settings.api_key || !connectionSettings.settings.api_key_secret)) {
    throw new Error('Twilio not connected');
  }
  return {
    accountSid: connectionSettings.settings.account_sid,
    apiKey: connectionSettings.settings.api_key,
    apiKeySecret: connectionSettings.settings.api_key_secret,
    phoneNumber: connectionSettings.settings.phone_number
  };
}

export async function getTwilioClient() {
  const { accountSid, apiKey, apiKeySecret } = await getCredentials();
  return twilio(apiKey, apiKeySecret, {
    accountSid: accountSid
  });
}

export async function getTwilioFromPhoneNumber() {
  const { phoneNumber } = await getCredentials();
  return phoneNumber;
}

export async function getTwilioStatus(): Promise<{ connected: boolean; phoneNumber: string | null; error?: string }> {
  try {
    const { phoneNumber } = await getCredentials();
    return { connected: true, phoneNumber: phoneNumber || null };
  } catch (error: any) {
    return { connected: false, phoneNumber: null, error: error.message };
  }
}

export async function sendSMS(to: string, body: string): Promise<{ success: boolean; sid?: string; error?: string }> {
  try {
    const client = await getTwilioClient();
    const fromNumber = await getTwilioFromPhoneNumber();
    
    const MAX_SMS_LENGTH = 1600;
    const segments = [];
    let remaining = body;
    while (remaining.length > 0) {
      if (remaining.length <= MAX_SMS_LENGTH) {
        segments.push(remaining);
        break;
      }
      let splitAt = remaining.lastIndexOf(' ', MAX_SMS_LENGTH);
      if (splitAt === -1) splitAt = MAX_SMS_LENGTH;
      segments.push(remaining.slice(0, splitAt));
      remaining = remaining.slice(splitAt).trim();
    }

    let lastSid = '';
    for (const segment of segments) {
      const msg = await client.messages.create({
        to,
        from: fromNumber,
        body: segment,
      });
      lastSid = msg.sid;
    }
    return { success: true, sid: lastSid };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
