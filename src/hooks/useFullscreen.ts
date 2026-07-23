import { useState, useEffect, useCallback } from "react";
import { arrivalTap } from "@/lib/mirror/audio";

interface ExtendedDocument extends Document {
  webkitFullscreenElement?: Element;
  mozFullScreenElement?: Element;
  msFullscreenElement?: Element;
  webkitExitFullscreen?: () => Promise<void>;
  mozCancelFullScreen?: () => Promise<void>;
  msExitFullscreen?: () => Promise<void>;
}

interface ExtendedHTMLElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
  mozRequestFullScreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  const checkFullscreenStatus = useCallback(() => {
    if (typeof document === "undefined") return false;
    const doc = document as ExtendedDocument;
    return !!(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const doc = document as ExtendedDocument;
    
    // Check if fullscreen API is supported
    const supported = !!(
      doc.fullscreenEnabled ||
      // @ts-expect-error - vendor prefixes
      doc.webkitFullscreenEnabled ||
      // @ts-expect-error - vendor prefixes
      doc.mozFullScreenEnabled ||
      // @ts-expect-error - vendor prefixes
      doc.msFullscreenEnabled
    );
    setIsSupported(supported);

    const handleFullscreenChange = () => {
      setIsFullscreen(checkFullscreenStatus());
    };

    // Initial check
    setIsFullscreen(checkFullscreenStatus());

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, [checkFullscreenStatus]);

  const enterFullscreen = useCallback(async () => {
    if (typeof document === "undefined") return;
    const elem = document.documentElement as ExtendedHTMLElement;

    try {
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        await elem.mozRequestFullScreen();
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
      }
      arrivalTap();
    } catch (err) {
      console.warn("Fullscreen request denied or failed:", err);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    if (typeof document === "undefined") return;
    const doc = document as ExtendedDocument;

    try {
      if (doc.exitFullscreen) {
        await doc.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        await doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        await doc.msExitFullscreen();
      }
      arrivalTap();
    } catch (err) {
      console.warn("Exit fullscreen failed:", err);
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (checkFullscreenStatus()) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }, [checkFullscreenStatus, enterFullscreen, exitFullscreen]);

  return {
    isFullscreen,
    isSupported,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
  };
}
