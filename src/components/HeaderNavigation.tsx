import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { resumeUrl } from "@/lib/resume";

interface NavLink {
  href: string;
  label: string;
}

interface HeaderNavigationProps {
  links: readonly NavLink[];
  currentPath: string;
}

export default function HeaderNavigation({
  links,
  currentPath,
}: HeaderNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  // Track active link
  const activeIndex = links.findIndex(
    (link) =>
      currentPath === link.href ||
      (link.href !== "/" && currentPath.startsWith(link.href)),
  );

  // Close menu on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on outside click (mobile)
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    // Delay to avoid immediate close on the toggle click
    const timer = setTimeout(() => {
      document.addEventListener("click", handleClick);
    }, 10);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClick);
    };
  }, [isOpen]);

  return (
    <div ref={navRef} className="relative flex items-center gap-1">
      {/* Desktop Navigation — flat inline links, no nested containers */}
      <nav
        className="hidden md:flex items-center gap-0.5"
        aria-label="Main navigation"
      >
        {links.map((link, idx) => (
          <a
            key={link.href}
            href={link.href}
            className={cn(
              "relative px-4 py-2 text-[0.8rem] font-medium tracking-wide transition-colors duration-200 rounded-lg",
              activeIndex === idx
                ? "text-white"
                : "text-white/45 hover:text-white/80",
            )}
          >
            {link.label}
            {activeIndex === idx && (
              <span
                className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full"
                style={{ background: "var(--premium-accent, #7af298)" }}
              />
            )}
          </a>
        ))}
      </nav>

      {/* Desktop Resume CTA */}
      <a
        href={resumeUrl}
        data-track-event="navigate_cv"
        data-track-label="Header Resume"
        className="hidden md:inline-flex items-center ml-3 px-5 py-2 rounded-full text-[0.78rem] font-semibold tracking-wide transition-all duration-200 border border-white/15 text-white/80 hover:text-white hover:border-white/30 hover:bg-white/[0.06] active:scale-[0.97]"
      >
        Resumes
      </a>

      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl text-white/70 hover:text-white transition-colors"
        aria-expanded={isOpen}
        aria-label="Toggle navigation menu"
      >
        <div className="relative w-[18px] h-[14px] flex flex-col justify-between">
          <motion.span
            animate={
              isOpen
                ? { rotate: 45, y: 6, width: "100%" }
                : { rotate: 0, y: 0, width: "100%" }
            }
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-full h-[1.5px] bg-current rounded-full block origin-center"
          />
          <motion.span
            animate={
              isOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }
            }
            transition={{ duration: 0.2 }}
            className="w-full h-[1.5px] bg-current rounded-full block"
          />
          <motion.span
            animate={
              isOpen
                ? { rotate: -45, y: -6, width: "100%" }
                : { rotate: 0, y: 0, width: "100%" }
            }
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-full h-[1.5px] bg-current rounded-full block origin-center"
          />
        </div>
      </button>

      {/* Mobile Navigation — compact dropdown sheet */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setIsOpen(false)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] md:hidden"
                />

                {/* Dropdown Sheet */}
                <motion.nav
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{
                    duration: 0.22,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                  className="fixed z-[9999] md:hidden"
                  style={{
                    top: "80px",
                    left: "16px",
                    right: "16px",
                  }}
                  aria-label="Mobile navigation"
                >
                  <div
                    className="rounded-2xl border border-white/[0.08] overflow-hidden"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(22, 22, 22, 0.98) 0%, rgba(14, 14, 14, 0.98) 100%)",
                      boxShadow:
                        "0 24px 64px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.04)",
                      backdropFilter: "blur(24px)",
                    }}
                  >
                    <div className="p-2">
                      {links.map((link, idx) => (
                        <a
                          key={link.href}
                          href={link.href}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3.5 rounded-xl text-[0.9rem] font-medium tracking-wide transition-colors duration-150",
                            activeIndex === idx
                              ? "text-white bg-white/[0.06]"
                              : "text-white/50 hover:text-white/80 hover:bg-white/[0.03]",
                          )}
                        >
                          {activeIndex === idx && (
                            <span
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{
                                background: "var(--premium-accent, #7af298)",
                              }}
                            />
                          )}
                          <span>{link.label}</span>
                        </a>
                      ))}
                    </div>

                    {/* Resume link */}
                    <div className="px-2 pb-2">
                      <div className="border-t border-white/[0.06] pt-2">
                        <a
                          href={resumeUrl}
                          data-track-event="navigate_cv"
                          data-track-label="Mobile Header Resume"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[0.85rem] font-semibold tracking-wide text-white/70 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors duration-150"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                          Resume
                        </a>
                      </div>
                    </div>
                  </div>
                </motion.nav>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
