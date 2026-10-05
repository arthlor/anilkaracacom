import ImmersiveStoryVisualFrame, {
  type ImmersiveStoryView,
} from "../shared/ImmersiveStoryVisualFrame";
import ItfaiyeAnimalRescueFocus from "./ItfaiyeAnimalRescueFocus";
import ItfaiyeCategoryGrowth from "./ItfaiyeCategoryGrowth";
import ItfaiyeSeasonalityHeatmap from "./ItfaiyeSeasonalityHeatmap";
import { withChartBoundary } from "../../../case-study/ChartBoundary";

const views: ImmersiveStoryView[] = [
  {
    id: "itfaiye-growth",
    kicker: "Görev baskısı",
    title: "Beş yıllık büyüme",
    visual: <ItfaiyeCategoryGrowth pureCanvas />,
  },
  {
    id: "itfaiye-seasonality",
    kicker: "Mevsimsel ritim",
    title: "Aylık görev matrisi",
    visual: <ItfaiyeSeasonalityHeatmap pureCanvas />,
  },
  {
    id: "itfaiye-animal-rescue",
    kicker: "Hayvan kurtarma",
    title: "Haziran zirvesi",
    visual: <ItfaiyeAnimalRescueFocus pureCanvas />,
  },
];

function IstanbulFirefightersStoryVisual() {
  return (
    <ImmersiveStoryVisualFrame
      views={views}
      ariaLabel="İstanbul İtfaiyesi yangın dışı görev hikayesi"
    />
  );
}

export default withChartBoundary(
  IstanbulFirefightersStoryVisual,
  "IstanbulFirefightersStoryVisual",
);
