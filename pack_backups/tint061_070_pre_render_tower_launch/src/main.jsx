import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import AppErrorBoundary from "./components/AppErrorBoundary.jsx";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/cards.css";
import "./styles/responsive.css";

createRoot(document.getElementById("root")).render(<AppErrorBoundary><App /></AppErrorBoundary>);
