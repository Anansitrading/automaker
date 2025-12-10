import { useState, useEffect, useRef, useCallback } from "react";
import type { Project } from "@/store/app-store";
import type { NavigationItem } from "../config/navigation";

/**
 * Custom hook for managing scroll-based navigation tracking
 * Automatically highlights the active section based on scroll position
 * and provides smooth scrolling to sections
 */
export function useScrollTracking(
  navItems: NavigationItem[],
  currentProject: Project | null
) {
  const [activeSection, setActiveSection] = useState("api-keys");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Track scroll position to highlight active nav item
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const sections = navItems
        .filter((item) => item.id !== "danger" || currentProject)
        .map((item) => ({
          id: item.id,
          element: document.getElementById(item.id),
        }))
        .filter((s) => s.element);

      const containerRect = container.getBoundingClientRect();
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;

      // Check if scrolled to bottom (within a small threshold)
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50;

      if (isAtBottom && sections.length > 0) {
        // If at bottom, highlight the last visible section
        setActiveSection(sections[sections.length - 1].id);
        return;
      }

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section.element) {
          const rect = section.element.getBoundingClientRect();
          const relativeTop = rect.top - containerRect.top + scrollTop;
          if (scrollTop >= relativeTop - 100) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [currentProject, navItems]);

  // Scroll to a specific section with smooth animation
  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const relativeTop =
        elementRect.top - containerRect.top + container.scrollTop;

      container.scrollTo({
        top: relativeTop - 24,
        behavior: "smooth",
      });
    }
  }, []);

  return {
    activeSection,
    scrollToSection,
    scrollContainerRef,
  };
}
