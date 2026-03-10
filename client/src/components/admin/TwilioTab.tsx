import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { IconSave, IconAlertTriangle } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMarcelaSettings, useSaveMarcelaSettings, useTwilioStatus } from "@/features/ai-agent/hooks/use-agent-settings";
import { TelephonySettings } from "./marcela/TelephonySettings";
import { useGlobalAssumptions } from "./hooks";
import type { VoiceSettings } from "./marcela/types";

export default function TwilioTab() {
  const { toast } = useToast();
  const { data: globalData, isLoading, isError } = useMarcelaSettings();
  const { data: twilioStatus } = useTwilioStatus();
  const { data: globalAssumptions } = useGlobalAssumptions();
  const saveMutation = useSaveMarcelaSettings();

  const [draft, setDraft] = useState<VoiceSettings | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => { if (globalData && !draft) setDraft({ ...globalData }); }, [globalData, draft]);

  const updateField = useCallback(<K extends keyof VoiceSettings>(key: K, value: VoiceSettings[K]) => {
    if (!draft) return;
    setDraft({ ...draft, [key]: value });
    setIsDirty(true);
  }, [draft]);

  const handleSave = () => {
    if (draft) saveMutation.mutate(draft, { onSuccess: () => setIsDirty(false) });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !draft) {
    return (
      <div className="mt-6 p-8 flex flex-col items-center gap-4 text-center rounded-xl border border-amber-200/60 bg-amber-50/40">
        <IconAlertTriangle className="w-10 h-10 text-amber-500" />
        <div>
          <p className="font-semibold text-foreground">Failed to load Twilio settings</p>
          <p className="text-sm text-muted-foreground mt-1">Reload the page to try again.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Reload page</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Twilio</h2>
          <p className="text-muted-foreground text-sm">Phone and SMS telephony configuration.</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={!isDirty || saveMutation.isPending}
          className="gap-2"
          data-testid="button-save-twilio"
        >
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <IconSave className="w-4 h-4" />}
          Save
        </Button>
      </div>
      <TelephonySettings draft={draft} updateField={updateField} twilioStatus={twilioStatus} companyName={globalAssumptions?.companyName || "the company"} />
    </div>
  );
}
