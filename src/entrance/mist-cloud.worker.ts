import { buildCloud } from "./mist-cloud";

// Works the cloud out off the page's thread as soon as the worker starts, and hands the points back without copying them.
const places = buildCloud();
(self as unknown as Worker).postMessage(places, [places.buffer]);
