import { VisualizationIsland, type VisualizationIslandProps } from './VisualizationIsland';

export function NetworkGraphFrame<TState = never>({
  title,
  description,
  className,
  children,
}: VisualizationIslandProps<TState>) {
  return (
    <VisualizationIsland title={title} description={description} className={className}>
      <div className="min-h-[320px]">{children}</div>
    </VisualizationIsland>
  );
}
