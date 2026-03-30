import type { ReactNode } from "react";

import {
  VisualizationIsland,
  type VisualizationIslandProps,
} from "./VisualizationIsland";

type D3GeoMapFrameProps<TState = never> = VisualizationIslandProps<TState> & {
  legend?: ReactNode;
};

export function D3GeoMapFrame<TState = never>({
  title,
  description,
  className,
  children,
  legend,
}: D3GeoMapFrameProps<TState>) {
  return (
    <VisualizationIsland
      title={title}
      description={description}
      className={className}
    >
      <div className="space-y-4">
        <div>{children}</div>
        {legend && (
          <div className="text-sm text-muted-foreground">{legend}</div>
        )}
      </div>
    </VisualizationIsland>
  );
}
