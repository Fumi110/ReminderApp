// /src/main.jsx
// ReminderApp Ver.3.1 — 正式版（Router + LIFF + Firebase Auth Observer）

import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";

import { initLiff } from "./lib/liffClient";
import { initAuthObserver } from "./lib/firebaseAuthObserver";

function Bootstrap() {
  useEffect(() => {
    console.log("🔧 [Bootstrap] LIFF init");
    initLiff();

    console.log("🔧 [Bootstrap] Start Firebase Auth Observer");
    initAuthObserver();
  }, []);

  return <App />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Bootstrap />
    </BrowserRouter>
  </StrictMode>
);
