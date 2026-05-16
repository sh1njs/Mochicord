/**
 * Lightweight logger with colored output and timestamps.
 * Replaces scattered console.log calls throughout the project.
 */

const RESET = "\x1b[0m";
const COLORS = {
  info: "\x1b[36m", // Cyan
  success: "\x1b[32m", // Green
  warn: "\x1b[33m", // Yellow
  error: "\x1b[31m", // Red
  debug: "\x1b[35m", // Magenta
  system: "\x1b[34m", // Blue
};

const LABELS = {
  info: "INFO   ",
  success: "OK     ",
  warn: "WARN   ",
  error: "ERROR  ",
  debug: "DEBUG  ",
  system: "SYSTEM ",
};

/**
 * Format a timestamp as HH:MM:SS.
 * @returns {string}
 */
function timestamp() {
  return new Date().toTimeString().slice(0, 8);
}

/**
 * Internal log printer.
 * @param {'info'|'success'|'warn'|'error'|'debug'|'system'} level
 * @param {string} message
 */
function log(level, message) {
  const color = COLORS[level];
  const label = LABELS[level];
  const time = `\x1b[90m${timestamp()}\x1b[0m`; // Grey timestamp
  console.log(`${time} ${color}${label}${RESET} ${message}`);
}

export const logger = {
  /** General informational message. */
  info: (msg) => log("info", msg),
  /** Successful operation (green). */
  success: (msg) => log("success", msg),
  /** Non-fatal warning. */
  warn: (msg) => log("warn", msg),
  /** Error or failure. */
  error: (msg) => log("error", msg),
  /** Debug output (verbose). */
  debug: (msg) => log("debug", msg),
  /** Core system / startup messages. */
  system: (msg) => log("system", msg),
};
