import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FileSearch, Plus } from 'lucide-react';
import { toast } from 'sonner';
import AppHeader from '@/components/AppHeader';
import AnalyzingOverlay from '@/components/workspace/AnalyzingOverlay';
import DiagnosisPanel from '@/components/workspace/DiagnosisPanel';
import FollowUpChat from '@/components/workspace/FollowUpChat';
import HighlightList from '@/components/workspace/HighlightList';
import SafetyPanel from '@/components/workspace/SafetyPanel';
import ScreenshotViewer from '@/components/workspace/ScreenshotViewer';
import StatusBanner from '@/components/workspace/StatusBanner';
import StepsList from '@/components/workspace/StepsList';
import TimelinePanel from '@/components/workspace/TimelinePanel';
import VoicePanel from '@/components/workspace/VoicePanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { buildHighlights } from '@/lib/highlight';
import { getOcr, getPrefs, setPrefs } from '@/lib/sessionStore';
import { addScreenshot, getSessionView, patchStep, postMessage, viewUrlsFor } from '@/lib/troubleshoot';

export default function Workspace() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [viewUrls, setViewUrls] = useState({});
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState('');
  const [stage, setStage] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showHighlights, setShowHighlights] = useState(true);
  const [language, setLanguage] = useState(getPrefs().language || 'en');

  useEffect(() => {
    const stored = getSessionView(id);
    if (!stored) {
      setNotFound(true);
      return;
    }
    setSession(stored);
    viewUrlsFor(stored)
      .then(setViewUrls)
      .catch(() => toast.error('The screenshots for this session could not be reopened.'));
  }, [id]);

  const activeFileUri = session?.screenshots?.[activeIndex]?.file_uri || session?.screenshots?.[0]?.file_uri || '';
  const ocr = useMemo(() => getOcr(id, activeFileUri), [id, activeFileUri]);
  const highlights = useMemo(
    () => buildHighlights({ diagnosis: session, words: ocr?.words || [], imageWidth: ocr?.width, imageHeight: ocr?.height }),
    [session, ocr],
  );

  const changeLanguage = (code) => {
    setLanguage(code);
    setPrefs({ language: code });
  };

  const handleSend = async (text) => {
    setBusy('chat');
    setStage({ stage: 'model', label: 'Working through your answer' });
    try {
      setSession(await postMessage({ sessionId: id, text, language, onStage: setStage }));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy('');
      setStage(null);
    }
  };

  const handleAttach = async (file, label) => {
    setBusy('attach');
    try {
      const next = await addScreenshot({ sessionId: id, file, label, onStage: setStage });
      setSession(next);
      setActiveIndex((next.screenshots || []).length - 1);
      toast.success('The new screenshot was assessed.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy('');
      setStage(null);
    }
  };

  const handlePatch = (stepId, patch) => {
    try {
      setSession(patchStep({ sessionId: id, stepId, patch }));
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleAskAlternative = (step) => {
    handleSend(`Step ${step.order} “${step.title}” did not give me the expected result. What is the alternative fix?`);
  };

  if (notFound) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
          <FileSearch className="mx-auto h-8 w-8 text-muted-foreground" />
          <h1 className="mt-4 font-heading text-2xl font-semibold tracking-tight">That session is not on this device</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sessions are kept in the browser that created them. Start a new analysis, or open one from your session list.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/" className="inline-flex items-center gap-2 rounded-lg bg-evidence px-4 py-2 text-sm font-medium text-primary-foreground">
              <Plus className="h-4 w-4" /> New analysis
            </Link>
            <Link to="/history" className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
              Session list
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="h-32 animate-pulse rounded-2xl border border-border bg-card/40" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        compact
        action={
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg bg-evidence px-3 py-2 text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New analysis</span>
          </Link>
        }
      />

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6">
        <StatusBanner session={session} />
        {stage && <AnalyzingOverlay stage={stage} />}

        <div className="grid gap-5 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-7">
            <ScreenshotViewer
              session={session}
              viewUrls={viewUrls}
              highlights={highlights}
              showHighlights={showHighlights}
              onToggleHighlights={() => setShowHighlights((value) => !value)}
              activeIndex={activeIndex}
              onActiveIndex={setActiveIndex}
            />
            <HighlightList
              highlights={highlights}
              ocrAvailable={Boolean(ocr?.words?.length)}
              showHighlights={showHighlights}
              onToggleHighlights={() => setShowHighlights((value) => !value)}
            />
          </div>

          <div className="lg:col-span-5">
            <Tabs defaultValue="diagnosis" className="rounded-2xl border border-border bg-card/60 p-4">
              <TabsList className="grid w-full grid-cols-4 bg-secondary/60">
                <TabsTrigger value="diagnosis" className="text-xs">
                  Diagnosis
                </TabsTrigger>
                <TabsTrigger value="steps" className="text-xs">
                  Steps
                </TabsTrigger>
                <TabsTrigger value="safety" className="text-xs">
                  Safety
                </TabsTrigger>
                <TabsTrigger value="voice" className="text-xs">
                  Voice
                </TabsTrigger>
              </TabsList>
              <TabsContent value="diagnosis" className="mt-4">
                <DiagnosisPanel session={session} />
              </TabsContent>
              <TabsContent value="steps" className="mt-4">
                <StepsList session={session} onPatch={handlePatch} onAskAlternative={handleAskAlternative} />
              </TabsContent>
              <TabsContent value="safety" className="mt-4">
                <SafetyPanel session={session} />
              </TabsContent>
              <TabsContent value="voice" className="mt-4">
                <VoicePanel session={session} language={language} onLanguage={changeLanguage} />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <FollowUpChat session={session} busy={busy} onSend={handleSend} onAttach={handleAttach} />
          <TimelinePanel session={session} />
        </div>
      </main>
    </div>
  );
}