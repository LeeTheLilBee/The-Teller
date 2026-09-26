
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

import {
  tellerSessionExpiryEpoch,
} from "./teller/tellerRuntimeSession.js";

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
   * Hosted v2 session lifetime is set by Tower's token expiry.
   * Never mount a production workspace without a future expiry.
   * This client-side boundary is only an additional UX/request gate;
   * the Teller API verifies the signature and expiry independently.
   */
  const expiryEpoch =
    launch.source === "development_ui_only"
      ? 0
      : tellerSessionExpiryEpoch(
          window.__TELLER_TOWER_SESSION__
        );

  if (
    launch.source !== "development_ui_only" &&
    (
      expiryEpoch <= 0 ||
      expiryEpoch <= Date.now() / 1000
    )
  ) {
    try {
      delete window.__TELLER_TOWER_SESSION__;
    } catch {
      // The expiry lock remains authoritative for this screen.
    }

    renderTellerPreMountSurface(
      rootElement,
      { state: "locked", reason: "tower_session_expired" }
    );
    return;
  }

  clearTellerPreMountSurface(
    rootElement
  );

  const reactRoot =
    createRoot(rootElement);

  reactRoot.render(
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  );

  if (expiryEpoch > 0) {
    window.setTimeout(() => {
      try {
        delete window.__TELLER_TOWER_SESSION__;
      } catch {
        // API verification still prevents expired-token requests.
      }

      reactRoot.unmount();

      renderTellerPreMountSurface(
        rootElement,
        { state: "locked", reason: "tower_session_expired" }
      );
    }, Math.max(0, expiryEpoch * 1000 - Date.now()));
  }
}


void startTeller();
