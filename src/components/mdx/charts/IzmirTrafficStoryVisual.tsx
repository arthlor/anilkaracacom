import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import StreetFrequencyLineChart from "./StreetFrequencyLineChart";
import AccidentTypesBarChart from "./AccidentTypesBarChart";
import IncidentHeatmap from "./IncidentHeatmap";

export default function IzmirTrafficStoryVisual() {
  const [activeStepId, setActiveStepId] = useState<string>("trafik-zaman");

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
    <div className="relative w-full min-h-[520px] lg:min-h-[500px] flex items-center justify-center rounded-2xl border border-white/[0.08] bg-[#161618]/60 backdrop-blur-md shadow-[0_24px_60px_rgba(0,0,0,0.35)] p-4 overflow-hidden">
      <AnimatePresence>
        {activeStepId === "trafik-zaman" && (
          <motion.div
            key="trafik-zaman"
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -8 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute top-4 left-4 right-4 bottom-4 flex flex-col justify-center"
          >
            <StreetFrequencyLineChart pureCanvas />
          </motion.div>
        )}

        {activeStepId === "trafik-turler" && (
          <motion.div
            key="trafik-turler"
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -8 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute top-4 left-4 right-4 bottom-4 flex flex-col justify-center"
          >
            <AccidentTypesBarChart pureCanvas />
          </motion.div>
        )}

        {activeStepId === "trafik-isiharitasi" && (
          <motion.div
            key="trafik-isiharitasi"
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -8 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute top-4 left-4 right-4 bottom-4 flex flex-col justify-center"
          >
            <IncidentHeatmap pureCanvas />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
