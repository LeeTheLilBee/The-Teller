import React from "react";

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("THE TELLER RUNTIME ERROR:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="runtime-error-panel">
          <p className="eyebrow">Runtime Guard</p>
          <h1>The Teller caught a screen error.</h1>
          <p>{String(this.state.error?.message || this.state.error)}</p>
          <button type="button" onClick={() => window.location.reload()}>
            Reload App
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}
