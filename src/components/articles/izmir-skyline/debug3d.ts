/*
  On-page diagnostics for the 3D map, switched on with ?debug3d in the URL.
  Phones offer no console, so the map prints its own setup steps, WebGL
  details, context losses and errors as text over the scene.
*/

type Listener = (lines: string[]) => void;

const lines: string[] = [];
const listeners = new Set<Listener>();
let installed = false;

export const debug3dEnabled = () =>
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("debug3d");

export function debugLog(message: string) {
  if (!debug3dEnabled()) return;
  lines.push(`${(performance.now() / 1000).toFixed(1)}s ${message}`);
  if (lines.length > 36) lines.shift();
  const snapshot = [...lines];
  listeners.forEach((listener) => listener(snapshot));
}

export function subscribeDebug(listener: Listener) {
  listeners.add(listener);
  listener([...lines]);
  return () => {
    listeners.delete(listener);
  };
}

/** Device facts, a bare WebGL2 probe, and global error capture. */
export function installDebugHooks() {
  if (installed || !debug3dEnabled()) return;
  installed = true;

  debugLog(`ua ${navigator.userAgent.replace(/^Mozilla\/5\.0 /, "")}`);
  debugLog(
    `screen ${window.screen.width}x${window.screen.height} dpr ${window.devicePixelRatio} touch ${navigator.maxTouchPoints}`,
  );

  const probe = document.createElement("canvas");
  const gl = probe.getContext("webgl2");
  if (!gl) {
    debugLog(`probe: no webgl2 (webgl1: ${Boolean(probe.getContext("webgl"))})`);
  } else {
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    debugLog(
      `probe: webgl2 ${info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)}` +
        ` tex ${gl.getParameter(gl.MAX_TEXTURE_SIZE)} attribs ${gl.getParameter(gl.MAX_VERTEX_ATTRIBS)}` +
        ` halfFloatRT ${Boolean(gl.getExtension("EXT_color_buffer_half_float") || gl.getExtension("EXT_color_buffer_float"))}`,
    );
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }

  window.addEventListener("error", (event) =>
    debugLog(`error ${event.message} @${event.filename?.split("/").pop()}:${event.lineno}`),
  );
  window.addEventListener("unhandledrejection", (event) =>
    debugLog(`rejection ${String(event.reason).slice(0, 160)}`),
  );
  const original = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    debugLog(`console ${args.map(String).join(" ").slice(0, 200)}`);
    original(...args);
  };
}
