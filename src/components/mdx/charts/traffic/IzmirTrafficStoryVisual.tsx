import ImmersiveStoryVisualFrame, {
  type ImmersiveStoryView,
} from "../shared/ImmersiveStoryVisualFrame";
import AccidentTypesBarChart from "./AccidentTypesBarChart";
import IncidentHeatmap from "./IncidentHeatmap";
import StreetFrequencyLineChart from "./StreetFrequencyLineChart";
import { withChartBoundary } from "../../../case-study/ChartBoundary";

const views: ImmersiveStoryView[] = [
  {
    id: "trafik-zaman",
    kicker: "Corridor pressure",
    title: "Street rankings",
    visual: <StreetFrequencyLineChart pureCanvas />,
  },
  {
    id: "trafik-turler",
    kicker: "Incident burden",
    title: "Incident types",
    visual: <AccidentTypesBarChart pureCanvas />,
  },
  {
    id: "trafik-isiharitasi",
    kicker: "Weekly rhythm",
    title: "Day and hour",
    visual: <IncidentHeatmap pureCanvas />,
  },
];

function IzmirTrafficStoryVisual() {
  return (
    <ImmersiveStoryVisualFrame
      views={views}
      ariaLabel="İzmir traffic incident story"
    />
  );
}

export default withChartBoundary(
  IzmirTrafficStoryVisual,
  "IzmirTrafficStoryVisual",
);
