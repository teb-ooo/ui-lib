import "@tanstack/react-router";

declare module "@tanstack/react-router" {
  interface StaticDataRouteOption {
    /** Human title of the route; the command palette lists it under "Go to". */
    title?: string;
    /** Set false to leave the route out of "Go to": a public page, or a route the app lists itself. */
    palette?: boolean;
  }
}
