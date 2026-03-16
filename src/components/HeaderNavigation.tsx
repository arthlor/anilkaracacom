import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface NavLink {
  href: string;
  label: string;
}

interface HeaderNavigationProps {
  links: readonly NavLink[];
  currentPath: string;
  resumeHref: string;
}

export default function HeaderNavigation({ links, currentPath, resumeHref }: HeaderNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Track active link
  const activeIndex = links.findIndex(link => 
    currentPath === link.href || (link.href !== '/' && currentPath.startsWith(link.href))
  );

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll(); // Initial check
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <nav className="relative flex items-center">
      {/* Desktop Navigation */}
      <div className={cn(
        "hidden md:flex items-center gap-1 p-1 rounded-full border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden relative transition-all duration-300",
        isScrolled ? "bg-[#161616]/80 px-2" : "bg-[#161616]/40"
      )}>
        {/* Sliding Pill Background */}
        <AnimatePresence>
          {(hoveredIndex !== null || activeIndex !== -1) && (
            <motion.div
              layoutId="nav-pill"
              className="absolute h-[calc(100%-8px)] rounded-full bg-white/10 z-0"
              initial={false}
              animate={{
                left: hoveredIndex !== null 
                  ? `${(hoveredIndex * 100) / links.length}%` 
                  : activeIndex !== -1 
                    ? `${(activeIndex * 100) / links.length}%` 
                    : 0,
                width: `${100 / links.length}%`,
                x: 4,
                y: 0
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30
              }}
            />
          )}
        </AnimatePresence>

        {links.map((link, idx) => (
          <a
            key={link.href}
            href={link.href}
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={cn(
              "relative z-10 px-5 py-2.5 rounded-full text-[0.82rem] font-semibold tracking-tight transition-colors duration-200",
              (activeIndex === idx || hoveredIndex === idx) ? "text-white" : "text-white/50 hover:text-white/80"
            )}
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* Resume CTA (Always visible on desktop) */}
      <div className="hidden md:block ml-4">
        <a
          href={resumeHref}
          className="px-6 py-2.5 rounded-full bg-white text-black text-[0.82rem] font-bold tracking-tight hover:bg-white/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-white/10"
        >
          Resume
        </a>
      </div>

      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden flex items-center gap-3 px-5 py-3 rounded-full border border-white/10 bg-[#161616]/60 backdrop-blur-xl text-white text-[0.82rem] font-semibold tracking-tight shadow-xl active:scale-95 transition-all"
        aria-expanded={isOpen}
      >
        <span>{isOpen ? "Close" : "Menu"}</span>
        <div className="relative w-4 h-4 flex flex-col justify-center gap-1">
          <motion.span 
            animate={isOpen ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }}
            className="w-full h-[1.5px] bg-white rounded-full block" 
          />
          <motion.span 
            animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
            className="w-full h-[1.5px] bg-white rounded-full block" 
          />
          <motion.span 
            animate={isOpen ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }}
            className="w-full h-[1.5px] bg-white rounded-full block" 
          />
        </div>
      </button>

      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
            />
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[85%] max-w-sm bg-[#0a0a0a] border-l border-white/10 p-8 pt-24 z-[101] shadow-2xl"
            >
              <div className="flex flex-col gap-6">
                {links.map((link, idx) => (
                  <motion.a
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 + idx * 0.05 }}
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "text-2xl font-bold tracking-tight py-2 border-b border-white/5",
                      activeIndex === idx ? "text-white" : "text-white/40"
                    )}
                  >
                    {link.label}
                  </motion.a>
                ))}
                
                <motion.a
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  href={resumeHref}
                  className="mt-8 px-6 py-4 rounded-xl bg-white text-black text-center font-bold text-lg shadow-xl"
                >
                  Download Resume
                </motion.a>

                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-auto pt-10 text-[0.7rem] text-white/30 uppercase tracking-[0.2em]"
                >
                  © {new Date().getFullYear()} Anil Karaca
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
