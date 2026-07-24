import ImmersiveStoryVisualFrame, {
  type ImmersiveStoryView,
} from "./ImmersiveStoryVisualFrame";
import ItfaiyeAnimalRescueFocus from "./ItfaiyeAnimalRescueFocus";
import ItfaiyeCategoryGrowth from "./ItfaiyeCategoryGrowth";
import ItfaiyeSeasonalityHeatmap from "./ItfaiyeSeasonalityHeatmap";

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
    kicker: "Kurtarma dalgası",
    title: "Haziran yoğunluğu",
    visual: <ItfaiyeAnimalRescueFocus pureCanvas />,
  },
];

export default function IstanbulFirefightersStoryVisual() {
  return (
    <ImmersiveStoryVisualFrame
      views={views}
      ariaLabel="İstanbul İtfaiyesi yangın dışı görev hikayesi"
    />
  );
}
