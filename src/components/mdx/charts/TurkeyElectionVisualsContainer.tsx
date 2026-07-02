import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import ElectionResultsBarChart from "./ElectionResultsBarChart";
import TurkeyElectionMap from "./TurkeyElectionMap";
import PartyChangesChart from "./PartyChangesChart";

export default function TurkeyElectionVisualsContainer() {
  const [activeStepId, setActiveStepId] = useState<string>("election-overall");

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
    <div className="w-full relative min-h-[550px] flex flex-col justify-start">
      <AnimatePresence mode="wait">
        {activeStepId === "election-overall" && (
          <motion.div
            key="election-overall"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="w-full"
          >
            <ElectionResultsBarChart />
          </motion.div>
        )}

        {activeStepId === "election-map" && (
          <motion.div
            key="election-map"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="w-full"
          >
            <TurkeyElectionMap />
          </motion.div>
        )}

        {activeStepId === "election-change" && (
          <motion.div
            key="election-change"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="w-full"
          >
            <PartyChangesChart />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
