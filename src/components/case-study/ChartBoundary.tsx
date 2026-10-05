import {
  Component,
  Fragment,
  type ComponentType,
  type ErrorInfo,
  type ReactNode,
} from "react";

type BoundaryProps = { name: string; children: ReactNode };
type BoundaryState = { failed: boolean; attempt: number };

/*
  Keeps one broken graphic from blanking its part of the article: the reader
  gets a short note and a retry that remounts the chart from scratch.
*/
export class ChartBoundary extends Component<BoundaryProps, BoundaryState> {
  override state: BoundaryState = { failed: false, attempt: 0 };

  static getDerivedStateFromError(): Partial<BoundaryState> {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      `[${this.props.name}] graphic failed`,
      error,
      info.componentStack,
    );
  }

  retry = () => {
    this.setState((state) => ({ failed: false, attempt: state.attempt + 1 }));
  };

  override render() {
    if (!this.state.failed) {
      return (
        <Fragment key={this.state.attempt}>{this.props.children}</Fragment>
      );
    }

    const turkish = document.documentElement.lang === "tr";
    return (
      <div
        role="alert"
        className="flex min-h-[240px] w-full flex-col items-center justify-center gap-3 rounded-[18px] border border-border bg-card p-6 text-center"
      >
        <p className="text-sm text-muted-foreground">
          {turkish ? "Bu grafik yüklenemedi." : "This graphic couldn’t load."}
        </p>
        <button
          type="button"
          onClick={this.retry}
          className="min-h-10 rounded-full border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
        >
          {turkish ? "Tekrar dene" : "Try again"}
        </button>
      </div>
    );
  }
}

export function withChartBoundary<P extends object>(
  Chart: ComponentType<P>,
  name: string,
) {
  function BoundedChart(props: P) {
    return (
      <ChartBoundary name={name}>
        <Chart {...props} />
      </ChartBoundary>
    );
  }
  BoundedChart.displayName = `ChartBoundary(${name})`;
  return BoundedChart;
}
