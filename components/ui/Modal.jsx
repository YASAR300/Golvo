"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "max-w-lg",
  showClose = true,
  className = "",
}) {
  const modalRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose?.();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "modal-title" : undefined}
          aria-describedby={description ? "modal-description" : undefined}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Modal Dialog Content */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "relative w-full rounded-[8px] bg-[#0F1011] border border-white/10 text-[#F7F8F8] shadow-2xl z-10 overflow-hidden",
              maxWidth,
              className
            )}
          >
            {(title || showClose) && (
              <div className="flex items-start justify-between p-5 border-b border-white/[0.06]">
                <div>
                  {title && (
                    <h2
                      id="modal-title"
                      className="text-lg font-semibold text-[#F7F8F8] leading-tight"
                    >
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p
                      id="modal-description"
                      className="text-xs text-[#8A8F98] mt-1"
                    >
                      {description}
                    </p>
                  )}
                </div>
                {showClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close dialog"
                    className="text-[#8A8F98] hover:text-[#F7F8F8] rounded-[6px] p-1 transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E6AD2]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            <div className="p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default Modal;
