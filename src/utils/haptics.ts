/**
 * YAMAHA INVESTMENT EARNINGS INCOME - Tactile Haptic Vibration Engine
 * Provides tactile confirmation feedback for mobile and touch interactions.
 * Safe fallback for non-supporting browsers and web containers.
 */

export const HapticPattern = {
  // Button clicks and general interactions
  BUTTON_CLICK: [15],
  CONFIRM: [40],
  // Light touch for quick buttons and tab selects
  LIGHT_TAP: [15],
  // Medium press for modals and action buttons
  MEDIUM_PRESS: [35],
  // VIP plan select touch
  PLAN_SELECT: [20],
  // VIP plan purchase confirm trigger
  INVEST_CONFIRM: [40],
  // VIP investment purchase success celebration pattern
  INVEST_SUCCESS: [50, 60, 120],
  // Investment or transaction error pattern
  INVEST_ERROR: [80, 50, 80],
  // Spin wheel start kick
  SPIN_START: [45],
  // Spin wheel passing slice tick (fast mechanical feel)
  SPIN_TICK: [10],
  // Spin wheel winning celebration pattern
  SPIN_WIN: [60, 40, 80, 50, 140],
  // Deposit instant approval & wallet credit celebration
  DEPOSIT_APPROVED: [45, 60, 130],
  // Withdrawal request submitted
  WITHDRAW_SUBMIT: [30, 40, 60],
};

/**
 * Triggers a vibration pattern if supported by the client browser/device.
 * Returns true if triggered, false if unsupported or blocked.
 */
export function triggerHaptic(pattern: number | number[] = HapticPattern.LIGHT_TAP): boolean {
  if (typeof window === 'undefined') return false;
  if (!('navigator' in window) || !('vibrate' in navigator)) {
    return false;
  }
  try {
    return navigator.vibrate(pattern);
  } catch (err) {
    // Ignore permissions/unsupported vibration errors
    return false;
  }
}
