import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Pause, Play, Plus, RotateCcw, Square, Trash2 } from "lucide-react";
import { SaSa, type SaSaState } from "../components/brand/SaSa";
import { saSaAssetManifest } from "../components/brand/saSaAssets";
import { Section } from "../components/layout/Section";
import { IconButton } from "../components/ui/IconButton";
import { Tabs } from "../components/ui/Tabs";
import { SaSaScene, useSaSaAnchor } from "../features/sa-sa/SaSaSceneProvider";

const playgroundTabs = ["Animation matrix", "Sequence builder", "Code"] as const;
type PlaygroundTab = (typeof playgroundTabs)[number];

const animationStates = Object.keys(saSaAssetManifest.states) as SaSaState[];

const stateNotes: Record<SaSaState, string> = {
  idle: "Resting state with ambient eyes and blink overlays.",
  reacting: "A short acknowledgement for direct interaction.",
  thinking: "Used while Sa-Sa is reasoning over a request.",
  speaking: "Active reply state while message text streams.",
  acting: "Used before a safe page action runs.",
  walking: "Movement intent for a guided transition.",
  arriving: "Landing state after moving to a scene anchor.",
  success: "Completion acknowledgement after a finished action.",
  error: "Recoverable failure state for an unsuccessful action.",
  offline: "Fallback when the guide or network is unavailable.",
  loafing: "A layered idle loop with breathe and tail frames."
};

const defaultSequence: SaSaState[] = ["idle", "thinking", "acting", "speaking", "success"];

const playgroundScene = {
  id: "sa-sa-playground",
  priority: 30,
  anchors: [{ id: "sa-sa-playground-guide", placement: "inline-start", availability: "desktop" }],
  safeZones: [],
  content: [{ type: "document", id: "sa-sa-playground" }],
  actions: []
} as const;

function stateLabel(state: SaSaState) {
  return state.replace(/^./, (letter) => letter.toUpperCase());
}

function makeInvocationSnippet(state: SaSaState) {
  return `import { useSaSaRuntime } from "../features/sa-sa/SaSaProvider";

function PortfolioAction() {
  const { dispatch, requestBehavior } = useSaSaRuntime();

  async function run() {
    requestBehavior("${state}", "system");

    try {
      await runSafePageAction();
      dispatch({ type: "BEHAVIOR_FINISHED", behavior: "${state}" });
    } catch {
      requestBehavior("error", "system");
    }
  }

  return <button onClick={run}>Run action</button>;
}`;
}

export default function SaSaPlaygroundPage() {
  const [activeTab, setActiveTab] = useState<PlaygroundTab>("Animation matrix");
  const [selectedState, setSelectedState] = useState<SaSaState>("thinking");
  const [sequence, setSequence] = useState<SaSaState[]>(defaultSequence);
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const previewState = sequence[activeStep] ?? selectedState;
  const invocationSnippet = useMemo(() => makeInvocationSnippet(selectedState), [selectedState]);
  const guideAnchorRef = useSaSaAnchor("sa-sa-playground-guide");

  useEffect(() => {
    if (!isPlaying || sequence.length === 0) return;

    const timeout = window.setTimeout(() => {
      setActiveStep((current) => {
        if (current >= sequence.length - 1) {
          setIsPlaying(false);
          return current;
        }

        return current + 1;
      });
    }, 980);

    return () => window.clearTimeout(timeout);
  }, [activeStep, isPlaying, sequence.length]);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  function addStep() {
    setSequence((current) => [...current, selectedState]);
  }

  function removeStep(index: number) {
    setSequence((current) => current.filter((_, currentIndex) => currentIndex !== index));
    setActiveStep((current) => Math.max(0, Math.min(current, sequence.length - 2)));
  }

  function resetSequence() {
    setSequence(defaultSequence);
    setActiveStep(0);
    setIsPlaying(false);
  }

  async function copySnippet() {
    try {
      await navigator.clipboard.writeText(invocationSnippet);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Section className="sa-sa-playground" eyebrow="Sa-Sa lab">
      <SaSaScene scene={playgroundScene} />
      <div className="sa-sa-playground__heading">
        <div>
          <h1 id="page-title">Sa-Sa Playground</h1>
          <p>Inspect the real state registry, rehearse a behavior sequence, and pull the runtime invocation into a feature.</p>
        </div>
        <div aria-hidden="true" className="sa-sa-playground__guide-anchor" ref={guideAnchorRef} />
      </div>

      <Tabs onChange={setActiveTab} tabs={[...playgroundTabs]} value={activeTab} />

      {activeTab === "Animation matrix" ? (
        <section aria-label="Sa-Sa animation matrix" className="sa-sa-playground__matrix" role="tabpanel">
          {animationStates.map((state) => (
            <button
              aria-pressed={selectedState === state}
              className="sa-sa-playground__state"
              key={state}
              onClick={() => setSelectedState(state)}
              type="button"
            >
              <SaSa animate decorative size={92} state={state} />
              <span>{stateLabel(state)}</span>
              <small>{stateNotes[state]}</small>
            </button>
          ))}
        </section>
      ) : null}

      {activeTab === "Sequence builder" ? (
        <section aria-label="Sa-Sa animation sequence builder" className="sa-sa-playground__sequence" role="tabpanel">
          <div className="sa-sa-playground__preview">
            <div className="sa-sa-playground__preview-status">
              <span>Step {sequence.length ? activeStep + 1 : 0} of {sequence.length}</span>
              <strong>{stateLabel(previewState)}</strong>
            </div>
            <SaSa animate state={previewState} size={204} />
            <div className="sa-sa-playground__preview-actions">
              <IconButton label={isPlaying ? "Pause sequence" : "Play sequence"} onClick={() => setIsPlaying((current) => !current)}>
                {isPlaying ? <Pause size={17} aria-hidden="true" /> : <Play size={17} aria-hidden="true" />}
              </IconButton>
              <IconButton label="Stop sequence" onClick={() => { setIsPlaying(false); setActiveStep(0); }}>
                <Square size={16} aria-hidden="true" />
              </IconButton>
              <IconButton label="Restore default sequence" onClick={resetSequence}>
                <RotateCcw size={16} aria-hidden="true" />
              </IconButton>
            </div>
          </div>

          <div className="sa-sa-playground__sequence-editor">
            <div className="sa-sa-playground__add-step">
              <label htmlFor="sa-sa-sequence-state">Add behavior</label>
              <div>
                <select id="sa-sa-sequence-state" onChange={(event) => setSelectedState(event.target.value as SaSaState)} value={selectedState}>
                  {animationStates.map((state) => <option key={state} value={state}>{stateLabel(state)}</option>)}
                </select>
                <button className="bb-button bb-button--md bb-button--primary" onClick={addStep} type="button">
                  <Plus size={17} aria-hidden="true" />
                  Add step
                </button>
              </div>
            </div>

            <ol className="sa-sa-playground__timeline">
              {sequence.map((state, index) => (
                <li aria-current={index === activeStep ? "step" : undefined} key={`${state}-${index}`}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <button onClick={() => { setActiveStep(index); setIsPlaying(false); setSelectedState(state); }} type="button">{stateLabel(state)}</button>
                  <IconButton label={`Remove ${stateLabel(state)} step`} onClick={() => removeStep(index)}>
                    <Trash2 size={16} aria-hidden="true" />
                  </IconButton>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {activeTab === "Code" ? (
        <section aria-label="Sa-Sa runtime code" className="sa-sa-playground__code" role="tabpanel">
          <div className="sa-sa-playground__code-intro">
            <label htmlFor="sa-sa-code-state">Behavior to invoke</label>
            <select id="sa-sa-code-state" onChange={(event) => setSelectedState(event.target.value as SaSaState)} value={selectedState}>
              {animationStates.map((state) => <option key={state} value={state}>{stateLabel(state)}</option>)}
            </select>
            <p>Behavior requests travel through the runtime. The feature owns the safe action and always resolves the active state.</p>
          </div>
          <div className="sa-sa-playground__code-block">
            <IconButton label={copied ? "Code copied" : "Copy code"} onClick={() => void copySnippet()}>
              {copied ? <Check size={17} aria-hidden="true" /> : <Copy size={17} aria-hidden="true" />}
            </IconButton>
            <pre><code>{invocationSnippet}</code></pre>
          </div>
        </section>
      ) : null}
    </Section>
  );
}
