/**
 * extensionBridge.ts
 *
 * Utility for the Flow Finder web app to communicate with the
 * Flow Finder Chrome extension and retrieve stored accessibility errors.
 *
 * How it works:
 *  1. The extension's content/popup script calls background.js with
 *     action "storeAccessibilityErrors", which saves errors to chrome.storage.local.
 *  2. This bridge uses window.postMessage (content-script relay) OR
 *     chrome.runtime.sendMessage (if running inside the extension context)
 *     to ask the background for those errors.
 *  3. As a fallback it reads errors that the extension injected directly
 *     into window.__flowFinderErrors by a content script.
 */

export interface AccessibilityError {
  type:        string;
  message:     string;
  impact:      string;
  selector?:   string;
  element?:    string;
  sourceUrl?:  string;
  tabId?:      number;
  [key: string]: unknown;
}

export interface ExtensionErrorEntry {
  errors:    AccessibilityError[];
  url:       string;
  tabId:     number;
  timestamp: number;
}

// The extension ID — set this to your published extension's ID,
// or leave empty to use the postMessage relay approach.
const EXTENSION_ID = (process.env.NEXT_PUBLIC_EXTENSION_ID as string) || "";

// How long to wait for the extension to respond (ms)
const EXTENSION_TIMEOUT = 5000;

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Ask the background service worker directly via chrome.runtime.sendMessage.
 * Only works when the web app is loaded inside an extension page (e.g. popup).
 */
function askBackgroundDirect(action: string, payload: object = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
      return reject(new Error("chrome.runtime not available"));
    }

    const target = EXTENSION_ID || undefined;

    try {
  if (target) {
    chrome.runtime.sendMessage(
      target,
      { action, ...payload },
      (response) => {
        if (chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message));
        }
        resolve(response);
      }
    );
  } else {
    chrome.runtime.sendMessage(
      { action, ...payload },
      (response) => {
        if (chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message));
        }
        resolve(response);
      }
    );
  }
} catch (err) {
  reject(err);
}
  });
}

/**
 * Ask the extension via a postMessage relay.
 * Requires the extension's content script to be listening on the page
 * and forwarding messages to the background.
 *
 * Content script should do:
 *   window.addEventListener("message", (e) => {
 *     if (e.source !== window || e.data?.from !== "FLOW_FINDER_WEB") return;
 *     chrome.runtime.sendMessage(e.data.payload, (resp) =>
 *       window.postMessage({ from: "FLOW_FINDER_EXT", requestId: e.data.requestId, response: resp }, "*")
 *     );
 *   });
 */
function askBackgroundViaPostMessage(action: string, payload: object = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const requestId = `ff_${Date.now()}_${Math.random()}`;

    const timer = setTimeout(() => {
      window.removeEventListener("message", handler);
      reject(new Error("Extension did not respond in time"));
    }, EXTENSION_TIMEOUT);

    function handler(event: MessageEvent) {
      if (
        event.source !== window ||
        event.data?.from !== "FLOW_FINDER_EXT" ||
        event.data?.requestId !== requestId
      ) return;

      clearTimeout(timer);
      window.removeEventListener("message", handler);
      resolve(event.data.response);
    }

    window.addEventListener("message", handler);

    window.postMessage(
      { from: "FLOW_FINDER_WEB", requestId, payload: { action, ...payload } },
      "*"
    );
  });
}

/**
 * Try direct chrome API first, then fall back to postMessage relay.
 */
async function sendToBackground(action: string, payload: object = {}): Promise<any> {
  try {
    return await askBackgroundDirect(action, payload);
  } catch {
    return await askBackgroundViaPostMessage(action, payload);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch ALL accessibility errors stored by the extension (across all tabs).
 * Returns a flat array ready to pass to Gemini.
 */
export async function getExtensionErrors(): Promise<AccessibilityError[]> {
  // 1. Try asking the extension background
  try {
    const response = await sendToBackground("getAllAccessibilityErrors");
    if (response?.success && Array.isArray(response.errors) && response.errors.length > 0) {
      console.log(`[ExtensionBridge] Got ${response.errors.length} errors from extension`);
      return response.errors;
    }
  } catch (err) {
    console.warn("[ExtensionBridge] Could not reach extension background:", err);
  }

  // 2. Fallback: check if content script injected errors directly into the window
  if (typeof window !== "undefined" && (window as any).__flowFinderErrors) {
    const injected = (window as any).__flowFinderErrors as AccessibilityError[];
    console.log(`[ExtensionBridge] Got ${injected.length} errors from window.__flowFinderErrors`);
    return injected;
  }

  console.log("[ExtensionBridge] No extension errors found");
  return [];
}

/**
 * Fetch errors for a specific tab ID.
 */
export async function getExtensionErrorsForTab(tabId: number): Promise<AccessibilityError[]> {
  try {
    const response = await sendToBackground("getAccessibilityErrors", { tabId });
    if (response?.success && response.data?.errors) {
      return response.data.errors;
    }
  } catch (err) {
    console.warn("[ExtensionBridge] Could not reach extension background:", err);
  }
  return [];
}

/**
 * Check whether the extension is reachable from this page.
 */
export async function isExtensionAvailable(): Promise<boolean> {
  try {
    await sendToBackground("getAllAccessibilityErrors");
    return true;
  } catch {
    return false;
  }
}

/**
 * Clear stored errors for a tab after they have been used.
 */
export async function clearExtensionErrors(tabId: number): Promise<void> {
  try {
    await sendToBackground("clearAccessibilityErrors", { tabId });
  } catch (err) {
    console.warn("[ExtensionBridge] Could not clear errors:", err);
  }
}