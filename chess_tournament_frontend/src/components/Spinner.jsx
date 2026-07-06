export default function Spinner({ size = "2rem", color = "#6366f1", fullPage = false }) {
  const spinner = (
    <div data-testid="spinner" style={{
      width: size,
      height: size,
      border: `3px solid rgba(255,255,255,0.1)`,
      borderTopColor: color,
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
    }} />
  );

  if (fullPage) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "50vh",
      }}>
        {spinner}
      </div>
    );
  }

  return spinner;
}
