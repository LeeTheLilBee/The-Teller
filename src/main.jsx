
import React
  from "react";

import {
  createRoot,
} from "react-dom/client";

import App
  from "./App.jsx";

import AppErrorBoundary
  from "./components/AppErrorBoundary.jsx";

import {
  clearTellerPreMountSurface,
  prepareTellerBeforeReactMount,
  renderTellerPreMountSurface,
} from "./teller/tellerPreRenderBootstrap.js";

import "./styles/base.css";
import "./styles/layout.css";
import "./styles/cards.css";
import "./styles/responsive.css";


async function startTeller() {
  const rootElement =
    document.getElementById(
      "root"
    );


  if (!rootElement) {
    throw new Error(
      "Teller root element is missing."
    );
  }


  /*
   * PRE-REACT SECURITY GATE
   *
   * No React Teller application tree mounts while
   * Tower launch authority is unresolved.
   */
  renderTellerPreMountSurface(
    rootElement,
    {
      state:
        "opening",
    }
  );


  let launch;


  try {
    launch =
      await prepareTellerBeforeReactMount({
        windowLike:
          window,

        locationLike:
          window.location,

        historyLike:
          window.history,

        fetchImpl:
          window.fetch.bind(
            window
          ),

        env:
          import.meta.env,
      });

  } catch {
    launch = {
      ready:
        false,

      status:
        "locked",

      reason:
        "tower_pre_render_bootstrap_failed",
    };
  }


  if (
    launch?.ready !==
      true
  ) {
    renderTellerPreMountSurface(
      rootElement,
      {
        state:
          "locked",

        reason:
          launch?.reason ||
          "tower_pre_render_bootstrap_failed",
      }
    );

    return;
  }


  /*
   * Tower authority and any live persistence credential
   * are established BEFORE React mounts.
   */
  clearTellerPreMountSurface(
    rootElement
  );


  createRoot(
    rootElement
  ).render(
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  );
}


void startTeller();
