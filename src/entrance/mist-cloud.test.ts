import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { buildCloud, buildCloudSliced, CLOUD_KEY } from "./mist-cloud";

const sha = (c: Float32Array) => createHash("sha256").update(Buffer.from(c.buffer, c.byteOffset, c.byteLength)).digest("hex");

describe("the cloud of mist", () => {
  // The picture the owner approved is this exact cloud: a change to the noise, the seed or the order of the random
  // numbers changes the hash. If the change is deliberate, change CLOUD_KEY's suffix too, so stored clouds are dropped.
  it("is the same cloud every time: 48,750 points with a fixed fingerprint", () => {
    const cloud = buildCloud();
    expect(cloud.length / 3).toBe(48750);
    expect(sha(cloud)).toBe("0985b867537885cf4b738ff09b8d7856b55cfb6743431756bc3236fc287c53f2");
    expect(CLOUD_KEY).toContain("cloud-1");
  });

  it("works out in slices exactly what it works out in one piece, handing the page back in between", async () => {
    let breaths = 0;
    const tick = setInterval(() => breaths++, 0);
    const sliced = await buildCloudSliced(1);
    clearInterval(tick);
    expect(sha(sliced)).toBe(sha(buildCloud()));
    expect(breaths).toBeGreaterThan(0); // timers (the page's other work) ran while it was being worked out
  });
});
