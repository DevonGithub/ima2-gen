import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { editsFormToJson } from "../lib/codexBackend/normalize.ts";
import { gifRenderFields, isGifB64, parseGifOptions } from "../lib/gifOutput.ts";

describe("gif output helpers", () => {
  it("reads the request field", () => {
    assert.deepEqual(parseGifOptions(undefined), { gif: null });
    assert.deepEqual(parseGifOptions(false), { gif: null });
    assert.deepEqual(parseGifOptions(true), { gif: {} });
    assert.deepEqual(parseGifOptions({ frameCount: 2, frameDurationMs: 2000 }), { gif: { frameCount: 2, frameDurationMs: 2000 } });
    for (const raw of ["gif", [], { frameCount: 1 }, { frameCount: 2.5 }, { frameDurationMs: 2001 }, { frameCount: "4" }]) {
      assert.equal("error" in parseGifOptions(raw), true, JSON.stringify(raw));
    }
  });

  it("maps to the Images API fields", () => {
    assert.deepEqual(gifRenderFields({}), { output_format: "gif" });
    assert.deepEqual(gifRenderFields({ frameCount: 4, frameDurationMs: 120 }),
      { output_format: "gif", frame_count: 4, frame_duration_ms: 120 });
  });

  it("recognises GIF bytes only", () => {
    assert.equal(isGifB64(Buffer.from("GIF89a....").toString("base64")), true);
    assert.equal(isGifB64(Buffer.from("GIF87a....").toString("base64")), true);
    assert.equal(isGifB64(Buffer.from("\x89PNG\r\n\x1a\n").toString("base64")), false);
  });

  it("the native edit body keeps the frame controls as numbers", async () => {
    const form = new FormData();
    form.set("output_format", "gif");
    form.set("frame_count", "6");
    form.set("frame_duration_ms", "120");
    form.append("image", new Blob([Buffer.from("x")], { type: "image/png" }), "input-1.png");
    const body = await editsFormToJson(form);
    assert.equal(body.output_format, "gif");
    assert.equal(body.frame_count, 6);
    assert.equal(body.frame_duration_ms, 120);
  });
});
