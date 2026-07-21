import type { ScrollStageState } from "./ScrollStage";

export type AcceleratedSideScrollState = {
  distance: number;
  time: number;
};

export type AcceleratedSideScrollOptions = {
  activePixelsPerSecond?: number;
  idlePixelsPerSecond?: number;
  maxImpulsePixels?: number;
  maxDeltaSeconds?: number;
  maxVelocityBoost?: number;
  progressPixels?: number;
  velocityImpulseScale?: number;
  velocityDivisor?: number;
};

export type AcceleratedSideScrollFrame = {
  distance: number;
  impulse: number;
  offset: number;
  speed: number;
};

const defaultOptions = {
  activePixelsPerSecond: 55,
  idlePixelsPerSecond: 18,
  maxImpulsePixels: 72,
  maxDeltaSeconds: 0.05,
  maxVelocityBoost: 2.5,
  progressPixels: 260,
  velocityImpulseScale: 0.22,
  velocityDivisor: 500
};

export function createAcceleratedSideScrollState(): AcceleratedSideScrollState {
  return {
    distance: 0,
    time: 0
  };
}

export function advanceAcceleratedSideScroll(
  drift: AcceleratedSideScrollState,
  frame: ScrollStageState,
  options: AcceleratedSideScrollOptions = {}
): AcceleratedSideScrollFrame {
  const config = {
    ...defaultOptions,
    ...options
  };
  const deltaTime = Math.min(config.maxDeltaSeconds, Math.max(0, frame.time - drift.time));
  const verticalVelocity = Math.abs(frame.velocity);
  const sideVelocity = frame.sideVelocity;
  const sideDirection = sideVelocity === 0 ? 0 : Math.sign(sideVelocity);
  const speed =
    1 + Math.min(config.maxVelocityBoost, Math.max(verticalVelocity, Math.abs(sideVelocity)) / config.velocityDivisor);
  const baseSpeed = frame.active ? config.activePixelsPerSecond : config.idlePixelsPerSecond;
  const verticalImpulse = Math.min(
    config.maxImpulsePixels,
    verticalVelocity * deltaTime * config.velocityImpulseScale
  );
  const sideImpulse =
    sideDirection *
    Math.min(config.maxImpulsePixels, Math.abs(sideVelocity) * deltaTime * config.velocityImpulseScale);
  const impulse = verticalImpulse + sideImpulse;

  drift.time = frame.time;
  drift.distance += deltaTime * baseSpeed * speed + impulse;

  return {
    distance: drift.distance,
    impulse: Math.abs(impulse),
    offset: drift.distance + frame.progress * config.progressPixels,
    speed
  };
}
