import { useState, useEffect } from "react";

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const doc = document as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const el = document.documentElement as any;

function getFullscreenElement() {
  return doc.fullscreenElement || doc.webkitFullscreenElement || null;
}

function requestFullscreen() {
  if (el.requestFullscreen) return el.requestFullscreen();
  if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
}

function exitFullscreen() {
  if (doc.exitFullscreen) return doc.exitFullscreen();
  if (doc.webkitExitFullscreen) return doc.webkitExitFullscreen();
}

export function FullscreenButton() {
  const [isFullscreen, setIsFullscreen] = useState(!!getFullscreenElement());

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!getFullscreenElement());
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);

  const toggle = () => {
    if (!getFullscreenElement()) {
      requestFullscreen()?.catch?.(() => {});
    } else {
      exitFullscreen()?.catch?.(() => {});
    }
  };

  if (isIOS) return null;

  return (
    <button
      className="fullscreen-btn"
      onClick={toggle}
      aria-label="Toggle fullscreen"
    >
      {isFullscreen ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="currentColor"
        >
          <path d="M5 16h3v3h2v-5H5zm3-8H5v2h5V5H8zm6 11h2v-3h3v-2h-5zm2-11V5h-2v5h5V8z" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="currentColor"
        >
          <path d="M7 14H5v5h5v-2H7zm-2-4h2V7h3V5H5zm12 7h-3v2h5v-5h-2zM14 5v2h3v3h2V5z" />
        </svg>
      )}
    </button>
  );
}
