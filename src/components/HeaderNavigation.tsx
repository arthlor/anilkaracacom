import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { resumeUrl } from "@/lib/resume";
import { themeStorageKey } from "@/lib/site";

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
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLElement>(null);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const syncTheme = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    };

    syncTheme();
    window.addEventListener("themechange", syncTheme);

    return () => window.removeEventListener("themechange", syncTheme);
  }, []);

  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    const nextTheme = theme === "dark" ? "light" : "dark";

    const updateTheme = () => {
      const root = document.documentElement;
      const isDark = nextTheme === "dark";

      root.classList.toggle("dark", isDark);
      root.dataset.theme = nextTheme;

      try {
        localStorage.setItem(themeStorageKey, nextTheme);
      } catch {
        // Theme switching still works when storage is unavailable.
      }

      const metaColorScheme = document.querySelector<HTMLMetaElement>(
        'meta[name="color-scheme"]',
      );
      const metaThemeColor = document.querySelector<HTMLMetaElement>(
        'meta[name="theme-color"]',
      );

      if (metaColorScheme) {
        metaColorScheme.content = nextTheme;
      }
      if (metaThemeColor) {
        metaThemeColor.content = isDark ? "#121212" : "#fafafa";
      }

      setTheme(nextTheme);
      window.dispatchEvent(
        new CustomEvent("themechange", { detail: { theme: nextTheme } }),
      );
    };

    if (
      !document.startViewTransition ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      updateTheme();
      return;
    }

    const x = e.clientX;
    const y = e.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const transition = document.startViewTransition(updateTheme);

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];
      document.documentElement.animate(
        {
          clipPath,
        },
        {
          duration: 450,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    });
  };

  // Track active link
  const activeIndex = links.findIndex(
    (link) =>
      currentPath === link.href ||
      (link.href !== "/" && currentPath.startsWith(link.href)),
  );

  // Keep keyboard focus inside the open mobile menu.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        setIsOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      if (e.key !== "Tab" || !mobileMenuRef.current) return;

      const focusable = Array.from(
        mobileMenuRef.current.querySelectorAll<HTMLElement>("a[href], button"),
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    requestAnimationFrame(() => {
      mobileMenuRef.current?.querySelector<HTMLElement>("a[href]")?.focus();
    });
  }, [isOpen]);

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
      const target = e.target as Node;
      if (
        navRef.current &&
        !navRef.current.contains(target) &&
        !mobileMenuRef.current?.contains(target)
      ) {
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
            aria-current={activeIndex === idx ? "page" : undefined}
            className={cn(
              "relative px-4 py-2 text-[0.8rem] font-medium tracking-wide transition-colors duration-200 rounded-lg",
              activeIndex === idx
                ? "text-neutral-900 dark:text-white"
                : "text-neutral-500 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-neutral-200",
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
        className="hidden md:inline-flex items-center ml-3 px-5 py-2 rounded-full text-[0.78rem] font-semibold tracking-wide transition-all duration-200 border border-neutral-200 text-neutral-700 hover:text-neutral-950 hover:border-neutral-300 hover:bg-neutral-50 dark:border-white/15 dark:text-white/80 dark:hover:text-white dark:hover:border-white/30 dark:hover:bg-white/[0.06] active:scale-[0.97]"
      >
        CVs
      </a>

      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="flex items-center justify-center w-10 h-10 rounded-xl text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-white/[0.06] transition-colors active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        aria-pressed={theme === "dark"}
      >
        {theme === "dark" ? (
          <svg
            className="w-[18px] h-[18px]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
        ) : (
          <svg
            className="w-[18px] h-[18px]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        )}
      </button>

      {/* Mobile Menu Toggle */}
      <button
        ref={menuButtonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 dark:text-white/70 dark:hover:text-white dark:hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
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
                  className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998] md:hidden"
                />

                {/* Dropdown Sheet */}
                <motion.nav
                  ref={mobileMenuRef}
                  id="mobile-navigation"
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
                    className="rounded-2xl border border-neutral-200/80 dark:border-white/[0.08] overflow-hidden bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl"
                    style={{
                      boxShadow:
                        "0 24px 64px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.04)",
                    }}
                  >
                    <div className="p-2">
                      {links.map((link, idx) => (
                        <a
                          key={link.href}
                          href={link.href}
                          aria-current={
                            activeIndex === idx ? "page" : undefined
                          }
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3.5 rounded-xl text-[0.9rem] font-medium tracking-wide transition-colors duration-150",
                            activeIndex === idx
                              ? "text-neutral-900 bg-neutral-100 dark:text-white dark:bg-white/[0.06]"
                              : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 dark:text-white/50 dark:hover:text-white dark:hover:bg-white/[0.03]",
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
                      <div className="border-t border-neutral-100 dark:border-white/[0.06] pt-2">
                        <a
                          href={resumeUrl}
                          data-track-event="navigate_cv"
                          data-track-label="Mobile Header Resume"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[0.85rem] font-semibold tracking-wide text-neutral-600 hover:text-neutral-900 bg-neutral-50 hover:bg-neutral-100 dark:text-white/70 dark:hover:text-white dark:bg-white/[0.04] dark:hover:bg-white/[0.08] transition-colors duration-150"
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
                          CVs
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
