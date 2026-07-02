import type { ReactNode } from "react";

type ChartControlsDrawerProps = {
  label?: string;
  children: ReactNode;
};

export default function ChartControlsDrawer({
  label = "Filters",
  children,
}: ChartControlsDrawerProps) {
  return (
    <>
      <details className="viz-controls-drawer lg:hidden">
        <summary className="viz-controls-drawer__trigger">{label}</summary>
        <div className="viz-controls-drawer__panel">{children}</div>
      </details>
      <div className="viz-controls hidden lg:flex">{children}</div>
    </>
  );
}
