import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Mesh,
  PlaneGeometry,
  Points,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  type WebGLRenderer,
  type OrthographicCamera,
  type Texture,
  type WebGLRenderTarget,
} from "three";

/** The opening, in seconds on the intro clock. */
export const INTRO = {
  collectDelay: 0.7, // the points start at different times within this
  collectTake: 1.7, // and each takes this long to gather
  frameStart: 0.8, // the frame begins to draw...
  frameTake: 1.3, // ...and takes this long
  swingStart: 1.9, // the swing begins to fade in...
  swingTake: 0.7, // ...over this
  swingGo: 2.1, // and is let go (the page's code starts its physics)
  cameraTake: 3.2, // the camera settles over this
} as const;

import { DOT_PX, FOOT, HEAD_START, POINT_ALPHA, RADIUS, SPARKS, SPIN, SPIN_HEIGHT } from "./mist-cloud";

/**
 * Low mist around the swingset, in the same space as the swingset, made of real points: a cloud of tens of thousands of
 * points scattered through a volume that is thickest at the ground and thins out with height and with distance from the
 * swingset, clumped into wisps by a three dimensional noise field. Each point has a place in that space, so when the camera
 * moves the points move with parallax, and the whole cloud gyrates slowly round the swingset (quicker near the middle, the
 * other way at other heights) on the graphics card, so it costs the page nothing to keep moving. The frame is drawn first
 * into a texture with its depth; a point behind the frame is hidden by it and a point in front is drawn over it. The
 * legs fade out toward the ground. Every point is one device pixel, so the cloud is grain.
 *
 * The opening is one staged animation on a clock that starts when the picture first draws (`uIntro`, in seconds): the
 * points collect (they start spread out, higher and turning, and gather into place, the first ones early and the last
 * ones about a second later, fading in as they come); the frame draws itself (the beam from left to right, then the legs
 * downward); the swing fades in last; and the page's code settles the camera and lets the swing go. See INTRO.
 */

const FRAME_VERTEX = `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }`;

// The frame: the texture of it, drawn in the theme's ink, with the legs fading out toward the ground.
const FRAME_FRAGMENT = `
  uniform vec3 uColor; uniform vec2 uRes; uniform float uNear; uniform float uFar; uniform float uIntro;
  uniform vec3 uCamera; uniform vec3 uRight; uniform vec3 uUp; uniform vec3 uForward; uniform vec2 uLR; uniform vec2 uBT;
  uniform sampler2D uFrame; uniform sampler2D uDepth;
  void main() {
    vec2 uv = gl_FragCoord.xy / uRes;
    vec4 texel = texture(uFrame, uv);
    float cover = texel.a;
    float raw = texture(uDepth, uv).r;
    if (cover < 0.01 || raw >= 1.0) discard;
    vec3 origin = uCamera + uRight * mix(uLR.x, uLR.y, uv.x) + uUp * mix(uBT.x, uBT.y, uv.y);
    vec3 at = origin + uForward * (uNear + raw * (uFar - uNear));
    float foot = clamp(at.y / ${FOOT.toFixed(3)}, 0.0, 1.0);
    // The frame is drawn white and the swing grey into the texture, so the two can come in at different times.
    bool isFrame = texel.r / max(cover, 1e-3) > 0.75;
    float shown;
    if (isFrame) {
      // The frame draws itself: the beam from left to right, then the legs downward.
      float order = clamp(0.55 * (3.0 - at.y) / 3.0 + 0.45 * (at.x + 2.1) / 4.2, 0.0, 1.0);
      float progress = clamp((uIntro - ${INTRO.frameStart.toFixed(3)}) / ${INTRO.frameTake.toFixed(3)}, 0.0, 1.0) * 1.15;
      shown = smoothstep(order, order + 0.12, progress);
    } else {
      shown = smoothstep(${INTRO.swingStart.toFixed(3)}, ${(INTRO.swingStart + INTRO.swingTake).toFixed(3)}, uIntro);
    }
    float solid = cover * foot * shown;
    if (solid < 0.002) discard;
    gl_FragColor = vec4(uColor, solid);
  }`;

const POINT_VERTEX = `
  attribute float aPick;
  uniform float uTime; uniform float uIntro; uniform float uSize; uniform float uFaint; uniform float uTone; uniform vec3 uColor; uniform vec3 uCamera; uniform vec3 uForward; uniform vec3 uPivot;
  varying float vDist; varying float vAlpha;
  void main() {
    // Turn with the mist: quicker near the middle, the other way higher up.
    float r = length(position.xz);
    float angle = uTime * ${SPIN.toFixed(4)} * cos(position.y * ${SPIN_HEIGHT.toFixed(3)}) * (1.0 + 1.5 * exp(-r * 0.25));
    float c = cos(angle); float s = sin(angle);
    vec3 p = vec3(c * position.x - s * position.z, position.y, s * position.x + c * position.z);
    // The opening: each point gathers from further out, higher and turned round, the first early, the last late.
    float delay = fract(aPick * 131.0) * ${INTRO.collectDelay.toFixed(3)};
    float k = clamp((uIntro - delay) / ${INTRO.collectTake.toFixed(3)}, 0.0, 1.0);
    float gather = 1.0 - pow(1.0 - k, 3.0);
    float away = 1.0 - gather;
    float turn = away * (1.4 + 1.2 * fract(aPick * 53.0));
    float ct = cos(turn); float st = sin(turn);
    p.xz = vec2(ct * p.x - st * p.z, st * p.x + ct * p.z);
    p.xz *= 1.0 + away * (0.35 + 0.5 * fract(aPick * 17.0));
    p.y += away * (1.5 + 3.5 * fract(aPick * 29.0));
    vec4 view = modelViewMatrix * vec4(p, 1.0);
    vDist = -view.z;
    // Near points are stronger than far ones (as in air), each point has a tone of its own, a few are bright and larger.
    float depth = (vDist - dot(uPivot - uCamera, uForward)) / ${RADIUS.toFixed(3)}; // about -1 (near) to 1 (far)
    float near = clamp(0.5 - depth * 1.3, 0.0, 1.0);
    float spark = step(1.0 - ${SPARKS.toFixed(4)}, aPick);
    // On a dark page the ink is light, and the near points, being the brightest, are held back a little.
    float light = step(0.5, dot(uColor, vec3(0.299, 0.587, 0.114)));
    float tone = (0.25 + mix(2.1, 1.45, light) * near * near) * (0.25 + 1.6 * fract(aPick * 977.0) * fract(aPick * 977.0));
    vAlpha = mix(clamp(uTone * tone, 0.0, 0.9), 1.0, spark) * smoothstep(0.0, 0.55, k);
    gl_PointSize = uSize * (1.0 + 0.3 * spark);
    vAlpha *= uFaint;
    gl_Position = projectionMatrix * view;
  }`;

const POINT_FRAGMENT = `
  uniform vec3 uColor; uniform vec2 uRes; uniform float uNear; uniform float uFar; uniform float uIntro;
  uniform sampler2D uFrame; uniform sampler2D uDepth;
  varying float vDist; varying float vAlpha;
  void main() {
    // A point behind the frame is hidden by it.
    vec2 uv = gl_FragCoord.xy / uRes;
    float raw = texture(uDepth, uv).r;
    // (not during the opening: parts of the frame that are not drawn yet hide nothing)
    if (uIntro > ${(INTRO.swingStart + INTRO.swingTake).toFixed(3)} && texture(uFrame, uv).a > 0.5 && raw < 1.0 && vDist > uNear + raw * (uFar - uNear)) discard;
    gl_FragColor = vec4(uColor, vAlpha);
  }`;

export interface Mist {
  /** Seconds since the picture first drew (the opening animation's clock); 0 before. */
  elapsed(): number;
  /** Seconds of turning added to the mist's own clock (a user's drag), either way. */
  setSwirl(seconds: number): void;
  setColor(color: Color): void;
  /** Draws the cloud and the frame (`frame`: the frame's colour and depth) to whatever the renderer is set to draw to. */
  draw(renderer: WebGLRenderer, camera: OrthographicCamera, frame: WebGLRenderTarget, seconds: number): void;
  dispose(): void;
}

/** `intro: false` skips the opening (a user who asks for reduced motion gets the finished picture at once). */
export function createMist(places: Float32Array, intro = true): Mist {
  const uniforms = {
    uColor: { value: new Color(0x000000) },
    uTime: { value: 0 },
    uIntro: { value: 0 },
    uSize: { value: 1 },
    uFaint: { value: 1 },
    uTone: { value: POINT_ALPHA },
    uRes: { value: [1, 1] },
    uLR: { value: [-1, 1] },
    uBT: { value: [-1, 1] },
    uNear: { value: 0.1 },
    uFar: { value: 120 },
    uCamera: { value: new Vector3() },
    uRight: { value: new Vector3() },
    uUp: { value: new Vector3() },
    uForward: { value: new Vector3() },
    uPivot: { value: new Vector3(0, 1.5, 0) },
    uFrame: { value: null as Texture | null },
    uDepth: { value: null as Texture | null },
  };
  const options = { transparent: true, depthWrite: false, depthTest: false, uniforms } as const;
  const frameMaterial = new ShaderMaterial({ ...options, vertexShader: FRAME_VERTEX, fragmentShader: FRAME_FRAGMENT });
  const quadGeometry = new PlaneGeometry(2, 2);
  const quad = new Mesh(quadGeometry, frameMaterial);
  quad.frustumCulled = false;

  const picks = new Float32Array(places.length / 3);
  for (let i = 0; i < picks.length; i++) picks[i] = ((Math.imul(i + 1, 0x9e3779b1) >>> 0) % 1000003) / 1000003;
  const pointGeometry = new BufferGeometry();
  pointGeometry.setAttribute("position", new Float32BufferAttribute(places, 3));
  pointGeometry.setAttribute("aPick", new Float32BufferAttribute(picks, 1));
  const pointMaterial = new ShaderMaterial({ ...options, vertexShader: POINT_VERTEX, fragmentShader: POINT_FRAGMENT });
  const points = new Points(pointGeometry, pointMaterial);
  points.frustumCulled = false;
  points.renderOrder = 1;
  quad.renderOrder = 0;
  const scene = new Scene();
  scene.add(quad);
  scene.add(points);

  const size = new Vector2();
  let began = -1;
  let elapsed = 0;
  let swirl = 0;
  return {
    setSwirl(seconds) {
      swirl = seconds;
    },
    elapsed: () => elapsed,
    setColor(color) {
      uniforms.uColor.value.copy(color);
    },
    draw(renderer, camera, frame, seconds) {
      camera.updateMatrixWorld();
      if (began < 0) began = seconds;
      elapsed = intro ? Math.max(0, seconds - began) : 99;
      uniforms.uIntro.value = elapsed;
      uniforms.uTime.value = seconds - began + HEAD_START + swirl; // the mist's own clock starts when the picture does
      const buffer = renderer.getDrawingBufferSize(size);
      uniforms.uRes.value = [buffer.x, buffer.y];
      // A point is whole device pixels; one smaller than that is drawn as one pixel and made fainter by the lost area.
      const wanted = DOT_PX * renderer.getPixelRatio();
      const device = Math.max(1, Math.round(wanted));
      uniforms.uSize.value = device;
      uniforms.uFaint.value = Math.min(1, (wanted / device) ** 2);
      uniforms.uLR.value = [camera.left / camera.zoom, camera.right / camera.zoom];
      uniforms.uBT.value = [camera.bottom / camera.zoom, camera.top / camera.zoom];
      uniforms.uNear.value = camera.near;
      uniforms.uFar.value = camera.far;
      uniforms.uCamera.value.copy(camera.position);
      uniforms.uRight.value.setFromMatrixColumn(camera.matrixWorld, 0);
      uniforms.uUp.value.setFromMatrixColumn(camera.matrixWorld, 1);
      uniforms.uForward.value.setFromMatrixColumn(camera.matrixWorld, 2).negate();
      uniforms.uFrame.value = frame.texture;
      uniforms.uDepth.value = frame.depthTexture;
      renderer.render(scene, camera);
    },
    dispose() {
      frameMaterial.dispose();
      pointMaterial.dispose();
      quadGeometry.dispose();
      pointGeometry.dispose();
    },
  };
}
