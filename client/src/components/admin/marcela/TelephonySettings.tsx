import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { IconPhone, IconCheckCircle2, IconXCircle, IconMessageCircle, IconExternalLink, IconCopy, IconSend } from "@/components/icons";
import { VoiceSettings, TwilioStatus } from "./types";
import { useSendTestSms } from "@/features/ai-agent/hooks/use-agent-settings";

interface TelephonySettingsProps {
  draft: VoiceSettings;
  updateField: <K extends keyof VoiceSettings>(key: K, value: VoiceSettings[K]) => void;
  twilioStatus?: TwilioStatus;
  companyName: string;
}

export function TelephonySettings({ draft, updateField, twilioStatus, companyName }: TelephonySettingsProps) {
  const { toast } = useToast();
  const sendTestSms = useSendTestSms();
  const [testSmsTo, setTestSmsTo] = useState("");
  const agentName = draft.aiAgentName || "AI Agent";
  const [testSmsBody, setTestSmsBody] = useState(`Hello from ${agentName}! This is a test message from ${companyName}.`);

  const baseUrl = typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.host}`
    : "";
  const voiceWebhookUrl = `${baseUrl}/api/twilio/voice/incoming`;
  const smsWebhookUrl = `${baseUrl}/api/twilio/sms/incoming`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Webhook URL copied to clipboard" });
  };

  return (
    <Card className="bg-card border border-border/80 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <IconPhone className="w-4 h-4 text-muted-foreground" />
              Telephony & SMS (Twilio)
            </CardTitle>
            <CardDescription className="label-text mt-1">
              Configure phone calls and SMS messaging for {agentName} via Twilio.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {twilioStatus?.connected ? (
              <Badge variant="default" className="text-sm gap-1">
                <IconCheckCircle2 className="w-3 h-3" />
                Connected
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-sm gap-1">
                <IconXCircle className="w-3 h-3" />
                Not Connected
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {twilioStatus?.phoneNumber && (
          <div className="p-4 bg-muted rounded-lg border border-border">
            <Label className="label-text font-medium text-muted-foreground">Twilio Phone Number</Label>
            <p className="text-lg font-mono font-semibold mt-1" data-testid="text-twilio-phone">
              {twilioStatus.phoneNumber}
            </p>
          </div>
        )}


        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
          <div>
            <Label className="label-text font-medium flex items-center gap-1.5">
              <IconPhone className="w-3.5 h-3.5" />
              Phone Calls
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Allow inbound phone calls to {agentName} via Twilio Voice
            </p>
          </div>
          <Switch
            checked={draft.marcelaTwilioEnabled}
            onCheckedChange={(v) => updateField("marcelaTwilioEnabled", v)}
            disabled={!twilioStatus?.connected}
            data-testid="switch-marcela-twilio-enabled"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
          <div>
            <Label className="label-text font-medium flex items-center gap-1.5">
              <IconMessageCircle className="w-3.5 h-3.5" />
              SMS Messages
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Allow inbound SMS messages to {agentName} via Twilio SMS
            </p>
          </div>
          <Switch
            checked={draft.marcelaSmsEnabled}
            onCheckedChange={(v) => updateField("marcelaSmsEnabled", v)}
            disabled={!twilioStatus?.connected}
            data-testid="switch-marcela-sms-enabled"
          />
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="label-text font-medium">Phone Greeting</Label>
          <Textarea
            value={draft.marcelaPhoneGreeting}
            onChange={(e) => updateField("marcelaPhoneGreeting", e.target.value)}
            placeholder={`Hello, this is ${agentName}...`}
            className="bg-card min-h-[80px] text-sm"
            data-testid="textarea-phone-greeting"
          />
          <p className="text-xs text-muted-foreground">
            This message is spoken when someone calls the Twilio number before the conversation begins.
          </p>
        </div>

        <Separator />

        <div className="space-y-3">
          <Label className="label-text font-medium flex items-center gap-1.5">
            <IconExternalLink className="w-3.5 h-3.5" />
            Webhook URLs
          </Label>
          <p className="text-xs text-muted-foreground">
            Configure these URLs in your Twilio Console for the phone number's webhook settings.
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 p-2.5 bg-muted/50 rounded border font-mono text-xs break-all">
                <span className="text-muted-foreground">Voice: </span>
                {voiceWebhookUrl}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-8 w-8"
                onClick={() => copyToClipboard(voiceWebhookUrl)}
                data-testid="button-copy-voice-webhook"
              >
                <IconCopy className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 p-2.5 bg-muted/50 rounded border font-mono text-xs break-all">
                <span className="text-muted-foreground">SMS: </span>
                {smsWebhookUrl}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-8 w-8"
                onClick={() => copyToClipboard(smsWebhookUrl)}
                data-testid="button-copy-sms-webhook"
              >
                <IconCopy className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {twilioStatus?.connected && (
          <>
            <Separator />
            <div className="space-y-3">
              <Label className="label-text font-medium flex items-center gap-1.5">
                <IconSend className="w-3.5 h-3.5" />
                Send Test SMS
              </Label>
              <div className="grid grid-cols-1 gap-3">
                <Input
                  value={testSmsTo}
                  onChange={(e) => setTestSmsTo(e.target.value)}
                  placeholder="+1234567890"
                  className="bg-card font-mono text-sm"
                  data-testid="input-test-sms-to"
                />
                <Textarea
                  value={testSmsBody}
                  onChange={(e) => setTestSmsBody(e.target.value)}
                  placeholder="Test message..."
                  className="bg-card min-h-[60px] text-sm"
                  data-testid="textarea-test-sms-body"
                />
                <Button
                  onClick={() => sendTestSms.mutate({ to: testSmsTo, message: testSmsBody })}
                  disabled={!testSmsTo.trim() || !testSmsBody.trim() || sendTestSms.isPending}
                  className="gap-2"
                  data-testid="button-send-test-sms"
                >
                  {sendTestSms.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <IconSend className="w-4 h-4" />
                  )}
                  Send Test
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
