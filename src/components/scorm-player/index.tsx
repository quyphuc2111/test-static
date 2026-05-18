// app/components/ScormPlayer.tsx
"use client";

import { useEffect, useRef } from "react";
// The package exposes a default export `pipwerks`
// @ts-ignore - No type definitions available
import pipwerks from "pipwerks-scorm-api-wrapper";

type ScormPlayerProps = {
  /** SCORM entry point file path (e.g., something like "/scorm/index.html") */
  entryPoint: string;
  /** Optional iframe title for accessibility */
  title?: string;
  /** Optional className for iframe styling */
  className?: string;
};

export default function ScormPlayer({ entryPoint, title = "SCORM Content", className }: ScormPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    // ---- Create in-memory SCORM data store (mock) ----
    const scormData: Record<string, string> = {
      "cmi.core.student_id": "student1",
      "cmi.core.student_name": "Test Student",
      "cmi.core.lesson_location": "",
      "cmi.core.lesson_status": "not attempted",
      "cmi.core.entry": "ab-initio",
      "cmi.core.score.raw": "",
      "cmi.core.score.min": "",
      "cmi.core.score.max": "",
      "cmi.core.total_time": "0000:00:00",
      "cmi.core.session_time": "0000:00:00",
      "cmi.suspend_data": "",
      "cmi.launch_data": "",
      "cmi.core.exit": "",
      "cmi.core.credit": "credit",
      "cmi.objectives._count": "0",
    };

    // ---- Expose SCORM 1.2 API on window for SCO to call ----
    // (many SCOs look up `window.API` or `window.top.API` etc.)
    // Here we set `window.API` at the hosting doc level.
    // @ts-expect-error: augmenting window with SCORM API
    window.API = {
      LMSInitialize: function () {
        console.log("LMSInitialize called");
        return "true";
      },
      LMSFinish: function () {
        console.log("LMSFinish called");
        return "true";
      },
      LMSGetValue: function (param: string) {
        console.log("LMSGetValue called with param:", param);
        const value = scormData[param] || "";
        console.log("LMSGetValue returning:", value);
        return value;
      },
      LMSSetValue: function (param: string, value: string) {
        console.log("LMSSetValue called with param:", param, "value:", value);
        scormData[param] = value;
        return "true";
      },
      LMSCommit: function () {
        console.log("LMSCommit called");
        return "true";
      },
      LMSGetLastError: function () {
        console.log("LMSGetLastError called");
        return "0";
      },
      LMSGetErrorString: function (_errorCode: string) {
        console.log("LMSGetErrorString called with errorCode:", _errorCode);
        return "";
      },
      LMSGetDiagnostic: function (_errorCode: string) {
        console.log("LMSGetDiagnostic called with errorCode:", _errorCode);
        return "";
      },
    };

    // ---- Initialize pipwerks and load the SCO ----
    const scorm = pipwerks.SCORM; // 1.2 by default; configure if you need 2004
    let initialized = false;

    const initializeAndLoad = () => {
      try {
        initialized = scorm.connection.initialize();
        if (initialized) {
          console.log("SCORM initialized successfully");
          // After initialize, set the iframe source
          if (iframeRef.current) {
            iframeRef.current.src = entryPoint;
          }
        } else {
          console.error("Failed to initialize SCORM");
          alert(
            "The course cannot communicate with the server. Please close the course window and relaunch the course to enable the communication."
          );
        }
      } catch (err) {
        console.error("Error initializing SCORM:", err);
        alert(
          "The course cannot communicate with the server. Please close the course window and relaunch the course to enable the communication."
        );
      }
    };

    initializeAndLoad();

    // ---- Terminate on unload ----
    const handleBeforeUnload = () => {
      try {
        if (initialized) {
          const ok = scorm.connection.terminate();
          if (ok) console.log("SCORM terminated successfully");
          else console.error("Failed to terminate SCORM");
        }
      } catch (err) {
        console.error("Error terminating SCORM:", err);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    // Cleanup on unmount
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // In case unmount happens without browser unload
      handleBeforeUnload();
      // @ts-expect-error cleanup
      delete window.API;
    };
  }, [entryPoint]);

  return (
    <iframe
      ref={iframeRef}
      id="scormContent"
      title={title}
      className={className}
      // Give it some defaults; you can override via className
      style={{ width: "100%", height: "100%", border: "0" }}
    />
  );
}
