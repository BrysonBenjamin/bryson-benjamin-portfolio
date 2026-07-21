import { useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { ArrowRight } from "lucide-react";
import { ScrollStage } from "../motion/ScrollStage";
import {
  advanceAcceleratedSideScroll,
  createAcceleratedSideScrollState
} from "../motion/sideScroll";
import { Mascot } from "../brand/Mascot";
import { useFeed } from "../../hooks/useFeed";
import type { FeedItem, FeedTone } from "../../types";

type RiverRaftStyle = CSSProperties & {
  "--raft-bob": string;
  "--raft-index": number;
  "--raft-tilt": string;
  "--raft-tone": string;
  "--raft-x": string;
  "--raft-y": string;
};

type RiverSceneStyle = CSSProperties & {
  "--dock-opacity": string;
  "--dock-y": string;
  "--flow-meter": string;
  "--intro-opacity": string;
  "--outro-opacity": string;
  "--side-impulse": string;
  "--river-progress": string;
};

type CurrentLineStyle = CSSProperties & {
  "--line-opacity": string;
  "--line-shift": string;
  "--line-tilt": string;
  "--line-y": string;
};

const toneColor: Record<FeedTone, string> = {
  amber: "var(--accent)",
  blue: "var(--accent-3)",
  mint: "var(--accent-2)",
  white: "var(--text-muted)"
};

const raftLanes = [
  { speed: 0.078, x: 8, y: 36 },
  { speed: 0.068, x: 38, y: 58 },
  { speed: 0.085, x: 68, y: 42 },
  { speed: 0.073, x: 98, y: 62 }
];

const currentLines = [
  { opacity: 0.18, shift: -16, tilt: -1.5, y: 28 },
  { opacity: 0.28, shift: 12, tilt: 0.8, y: 36 },
  { opacity: 0.2, shift: -8, tilt: -0.5, y: 45 },
  { opacity: 0.34, shift: 18, tilt: 1.1, y: 53 },
  { opacity: 0.24, shift: -22, tilt: -1, y: 61 },
  { opacity: 0.16, shift: 10, tilt: 0.4, y: 70 }
];

function wrap(value: number, max: number) {
  return ((value % max) + max) % max;
}

function wrapSigned(value: number, span: number) {
  return wrap(value + span / 2, span) - span / 2;
}

function getCurrentLineShift(shift: number, flow: number, index: number) {
  return wrapSigned(shift + flow * 0.075 + index * 17, 180);
}

function getRaftPosition(index: number, flow: number, time: number) {
  const lane = raftLanes[index % raftLanes.length];
  const x = wrap(lane.x - flow * lane.speed, 128) - 14;
  const wave = Math.sin(time * 1.6 + index * 1.35 + x * 0.08);
  const counterWave = Math.sin(time * 0.9 + index * 2.1);

  return {
    bob: wave * 8,
    tilt: wave * 1.4 + counterWave * 0.6,
    x,
    y: lane.y
  };
}

function getSourceLabel(source: "fallback" | "live" | "loading") {
  if (source === "live") {
    return "db-live";
  }

  if (source === "loading") {
    return "syncing";
  }

  return "static-safe";
}

function RaftButton({
  flow,
  index,
  item,
  onSelect,
  selected,
  time
}: {
  flow: number;
  index: number;
  item: FeedItem;
  onSelect: (item: FeedItem) => void;
  selected: boolean;
  time: number;
}) {
  const position = getRaftPosition(index, flow, time);
  const style = {
    "--raft-bob": `${position.bob.toFixed(1)}px`,
    "--raft-index": index,
    "--raft-tilt": `${position.tilt.toFixed(2)}deg`,
    "--raft-tone": toneColor[item.tone],
    "--raft-x": `${position.x.toFixed(2)}%`,
    "--raft-y": `${position.y}%`
  } as RiverRaftStyle;

  return (
    <button
      aria-pressed={selected}
      className={`river-raft river-raft--${item.tone}`}
      onClick={() => onSelect(item)}
      style={style}
      type="button"
    >
      <span className="river-raft__wake" aria-hidden="true" />
      <span className="river-raft__planks" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span className="river-raft__body">
        <span className="river-raft__meta">
          <span>{item.id}</span>
          <span>{item.state}</span>
        </span>
        <strong>{item.title}</strong>
        <span>{item.detail}</span>
      </span>
    </button>
  );
}

export function RiverBuildLog() {
  const { feedItems, feedSource } = useFeed();
  const sideScrollRef = useRef(createAcceleratedSideScrollState());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedItem = useMemo(
    () => feedItems.find((item) => item.id === selectedId) ?? null,
    [feedItems, selectedId]
  );

  return (
    <section aria-labelledby="build-log-title" className="river-log-section" id="build-log">
      <ScrollStage className="river-log-stage" offsetSelector=".site-header" stickyOffset={64} travel={2.5}>
        {(stageFrame) => {
          const { active, progress, time } = stageFrame;
          const sideScroll = advanceAcceleratedSideScroll(sideScrollRef.current, stageFrame, {
            activePixelsPerSecond: 88,
            idlePixelsPerSecond: 24,
            maxImpulsePixels: 110,
            maxVelocityBoost: 3,
            progressPixels: 520,
            velocityDivisor: 420,
            velocityImpulseScale: 0.36
          });
          const flow = sideScroll.offset;
          const dockProgress = selectedItem ? 1 : Math.min(1, Math.max(0, (progress - 0.58) / 0.22));
          const dockItem = selectedItem ?? feedItems[0];
          const showDock = Boolean(dockItem && (selectedItem || progress > 0.5));
          const sceneStyle = {
            "--dock-opacity": dockProgress.toFixed(3),
            "--dock-y": `${((1 - dockProgress) * 28).toFixed(1)}px`,
            "--flow-meter": `${Math.round(progress * 100)}%`,
            "--intro-opacity": active && progress < 0.18 ? "1" : "0",
            "--outro-opacity": progress > 0.86 ? "1" : "0",
            "--side-impulse": `${Math.min(1, sideScroll.impulse / 55).toFixed(3)}`,
            "--river-progress": progress.toFixed(3)
          } as RiverSceneStyle;

          return (
            <div className="river-log-scene" style={sceneStyle}>
              <div className="river-log__bank river-log__bank--top" aria-hidden="true" />
              <div className="river-log__bank river-log__bank--bottom" aria-hidden="true" />
              <div className="river-current-lines" aria-hidden="true">
                {currentLines.map((line, index) => (
                  <span
                    key={`${line.y}-${line.shift}`}
                    style={
                      {
                        "--line-opacity": `${line.opacity}`,
                        "--line-shift": `${getCurrentLineShift(line.shift, flow, index).toFixed(1)}px`,
                        "--line-tilt": `${line.tilt}deg`,
                        "--line-y": `${line.y}%`
                      } as CurrentLineStyle
                    }
                  />
                ))}
              </div>
              <div className="river-scroll-cue river-scroll-cue--intro" aria-hidden="true">
                Stay a while. The current carries the work.
              </div>
              <div className="river-flow-label" aria-hidden="true">
                side x{sideScroll.speed.toFixed(1)} / {Math.round(progress * 100)}%
              </div>
              <div className="river-flow-meter" aria-hidden="true">
                <span />
              </div>

              <div className="river-log-label">
                <p className="feed-kicker">Public build log</p>
                <h2 id="build-log-title">The work log floats through the site.</h2>
                <p>
                  Each raft is a public Linear entry. The river keeps it moving, but the dock
                  keeps the details readable.
                </p>
                <div className="river-log-label__status">
                  <span className={`feed-sync feed-sync--${feedSource}`}>{getSourceLabel(feedSource)}</span>
                  <span>{Math.round(progress * 100)}% downstream</span>
                </div>
                <span className="river-log-label__pointer" aria-hidden="true">
                  <ArrowRight size={18} />
                </span>
              </div>

              <div className="river-raft-field" aria-label="Public build-log rafts">
                {feedItems.map((item, index) => (
                  <RaftButton
                    flow={flow}
                    index={index}
                    item={item}
                    key={item.id}
                    onSelect={(nextItem) => setSelectedId(nextItem.id)}
                    selected={selectedItem?.id === item.id}
                    time={active ? time : time * 0.6}
                  />
                ))}
              </div>

              {dockItem && showDock ? (
                <aside className="river-dock" aria-label="Selected build-log entry">
                  <div className="river-dock__meta">
                    <span>{dockItem.id}</span>
                    <span>{dockItem.state}</span>
                  </div>
                  <h3>{dockItem.title}</h3>
                  <p>{dockItem.detail}</p>
                  <div className="river-dock__footer">
                    <span>workspace brysonbenjamin</span>
                    <span>public mirror</span>
                  </div>
                </aside>
              ) : null}

              <div className="river-mascot" aria-hidden="true">
                <Mascot decorative size={72} speech="RAFTS!" />
              </div>

              <div className="river-scroll-cue river-scroll-cue--outro" aria-hidden="true">
                Keep scrolling. Dry land ahead.
              </div>
            </div>
          );
        }}
      </ScrollStage>
    </section>
  );
}
