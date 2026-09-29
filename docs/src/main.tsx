import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { makeRouter } from "./router";
import "./app.css";

const router = makeRouter();

const el = document.getElementById("root");
if (!el) throw new Error("no #root");
createRoot(el).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
