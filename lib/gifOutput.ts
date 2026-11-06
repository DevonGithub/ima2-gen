/**
 * Animated GIF output on the GPT OAuth lane.
 *
 * The Images API takes `output_format: "gif"` plus `frame_count` and `frame_duration_ms` on
 * /generations and /edits (the Codex image_gen shape, openai/codex#59073). Limits and defaults
 * are the API's own: 2-16 frames, 20-2000 ms per frame, 9 frames at 200 ms when omitted.
 */
export const GIF_MIN_FRAMES = 2;
export const GIF_MAX_FRAMES = 16;
export const GIF_MIN_FRAME_MS = 20;
export const GIF_MAX_FRAME_MS = 2000;

export interface GifOptions {
  frameCount?: number | undefined;
  frameDurationMs?: number | undefined;
}

type GifParse = { gif: GifOptions | null } | { error: string; code: string };

const inRange = (value: unknown, min: number, max: number): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;

/** Read the request's `gif` field: absent or false means a still; true uses the API defaults. */
export function parseGifOptions(raw: unknown): GifParse {
  if (raw === undefined || raw === null || raw === false) return { gif: null };
  if (raw === true) return { gif: {} };
  if (typeof raw !== "object" || Array.isArray(raw)) {
    return { error: "gif must be true or an object", code: "GIF_OPTIONS_INVALID" };
  }
  const { frameCount, frameDurationMs } = raw as Record<string, unknown>;
  if (frameCount !== undefined && !inRange(frameCount, GIF_MIN_FRAMES, GIF_MAX_FRAMES)) {
    return { error: `gif.frameCount must be an integer from ${GIF_MIN_FRAMES} to ${GIF_MAX_FRAMES}`, code: "GIF_OPTIONS_INVALID" };
  }
  if (frameDurationMs !== undefined && !inRange(frameDurationMs, GIF_MIN_FRAME_MS, GIF_MAX_FRAME_MS)) {
    return { error: `gif.frameDurationMs must be an integer from ${GIF_MIN_FRAME_MS} to ${GIF_MAX_FRAME_MS}`, code: "GIF_OPTIONS_INVALID" };
  }
  return { gif: { frameCount, frameDurationMs } };
}

/** The Images API wants the format and its controls as sibling fields. */
export function gifRenderFields(gif: GifOptions): Record<string, string | number> {
  return {
    output_format: "gif",
    ...(gif.frameCount !== undefined ? { frame_count: gif.frameCount } : {}),
    ...(gif.frameDurationMs !== undefined ? { frame_duration_ms: gif.frameDurationMs } : {}),
  };
}

export function isGifB64(b64: string): boolean {
  const header = Buffer.from(b64.slice(0, 8), "base64").toString("latin1");
  return header.startsWith("GIF87a") || header.startsWith("GIF89a");
}
