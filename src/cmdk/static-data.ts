import "@tanstack/react-router";

declare module "@tanstack/react-router" {
  interface StaticDataRouteOption {
    /** Human title of the route; the command palette lists it under "Go to". */
    title?: string;
  }
}
