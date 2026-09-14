import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "32px 24px",
            background: "#FEF2F2",
            borderRadius: "16px",
            border: "1px solid #FECACA",
            margin: "20px 0",
            textAlign: "center",
            color: "#991B1B",
          }}
        >
          <div style={{ fontSize: "36px", marginBottom: "8px" }}>⚠️</div>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: 800, color: "#991B1B" }}>
            {this.props.fallbackTitle || "Something went wrong loading this section"}
          </h3>
          <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#B91C1C", maxWidth: "480px", marginInline: "auto" }}>
            {this.state.error?.message || "An unexpected error occurred. Please refresh or try again."}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            style={{
              padding: "8px 18px",
              background: "#DC2626",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Reload Section
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
