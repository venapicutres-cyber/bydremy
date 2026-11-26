/**
 * Small compatibility layer for jQuery plugins that the cloned WordPress
 * pages expect but that are not part of the page payload.
 *
 * The WPkoi countdown widget renders a plain list with `data-date` and four
 * `data-*` placeholders, then calls `$el.countdown()`.  Without the original
 * plugin that call throws `$(...).countdown is not a function` and the
 * countdown never starts, so we provide a drop-in implementation that follows
 * the same markup contract.
 */

type CountdownHost = HTMLElement & { __bydreamyCountdownTimer?: number };

type JQueryStatic = {
  fn: Record<string, unknown> & { countdown?: unknown };
  (input: unknown): { each: (callback: (this: CountdownHost) => void) => unknown };
};

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function startCountdown(element: CountdownHost) {
  const raw = (element.getAttribute('data-date') || '').trim();
  const target = raw ? new Date(raw).getTime() : Number.NaN;

  if (element.__bydreamyCountdownTimer) {
    window.clearInterval(element.__bydreamyCountdownTimer);
  }

  const write = (key: string, value: number) => {
    const node = element.querySelector<HTMLElement>(`[data-${key}]`);
    if (node) node.textContent = pad(value);
  };

  const render = () => {
    if (!element.isConnected) {
      if (element.__bydreamyCountdownTimer) {
        window.clearInterval(element.__bydreamyCountdownTimer);
        element.__bydreamyCountdownTimer = undefined;
      }
      return;
    }
    const diff = Number.isFinite(target) ? Math.max(0, target - Date.now()) : 0;
    write('days', Math.floor(diff / 86400000));
    write('hours', Math.floor((diff / 3600000) % 24));
    write('minutes', Math.floor((diff / 60000) % 60));
    write('seconds', Math.floor((diff / 1000) % 60));
  };

  render();
  element.__bydreamyCountdownTimer = window.setInterval(render, 1000);
}

export function installJQueryCompat() {
  const globalWindow = window as unknown as { jQuery?: JQueryStatic; $?: JQueryStatic };
  const jq = globalWindow.jQuery;
  if (!jq || typeof jq !== 'function' || !jq.fn) return;
  // WordPress loads jQuery in no-conflict mode, but the cloned inline scripts
  // still use `$`. Without this alias they throw `$ is not a function`.
  if (!globalWindow.$) globalWindow.$ = jq;
  if (typeof jq.fn.countdown === 'function') return;

  jq.fn.countdown = function countdown(this: unknown) {
    return jq(this).each(function countdownEach(this: CountdownHost) {
      startCountdown(this);
    });
  };
}
