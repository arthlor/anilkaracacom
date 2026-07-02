import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ItfaiyeCategoryGrowth from "./ItfaiyeCategoryGrowth";
import ItfaiyeSeasonalityHeatmap from "./ItfaiyeSeasonalityHeatmap";
import ItfaiyeAnimalRescueFocus from "./ItfaiyeAnimalRescueFocus";

export default function IstanbulFirefightersStoryVisual() {
  const [activeStepId, setActiveStepId] = useState<string>("itfaiye-growth");

  // Listen to the scrollytelling step changes
  useEffect(() => {
    const handleStepChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ stepId: string }>;
      setActiveStepId(customEvent.detail.stepId);
    };

    window.addEventListener("scrolly:stepchange", handleStepChange);
    return () => {
      window.removeEventListener("scrolly:stepchange", handleStepChange);
    };
  }, []);

  return (
    <div className="relative w-full min-h-[540px] md:min-h-[500px] flex items-center justify-center rounded-2xl border border-white/[0.08] bg-[#161618]/60 backdrop-blur-md shadow-[0_24px_60px_rgba(0,0,0,0.35)] p-4 overflow-hidden">
      <AnimatePresence>
        {activeStepId === "itfaiye-growth" && (
          <motion.div
            key="itfaiye-growth"
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -8 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute top-4 left-4 right-4 bottom-4 flex flex-col justify-center"
          >
            <ItfaiyeCategoryGrowth pureCanvas />
          </motion.div>
        )}

        {activeStepId === "itfaiye-seasonality" && (
          <motion.div
            key="itfaiye-seasonality"
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -8 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute top-4 left-4 right-4 bottom-4 flex flex-col justify-center"
          >
            <ItfaiyeSeasonalityHeatmap pureCanvas />
          </motion.div>
        )}

        {activeStepId === "itfaiye-animal-rescue" && (
          <motion.div
            key="itfaiye-animal-rescue"
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -8 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute top-4 left-4 right-4 bottom-4 flex flex-col justify-center"
          >
            <ItfaiyeAnimalRescueFocus pureCanvas />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
