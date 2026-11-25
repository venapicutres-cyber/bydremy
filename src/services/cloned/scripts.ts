import type { ClonedPageContext } from './types';

/**
 * A few theme helpers normally live in global plugin bundles that are not part
 * of the page payload. Provide a no-op so inline handlers do not throw.
 */
export function installCompatGlobals({ cleanups }: ClonedPageContext) {
  const globalWindow = window as unknown as Record<string, unknown>;
  if (typeof globalWindow.updateMenuPosition !== 'function') {
    globalWindow.updateMenuPosition = () => undefined;
    cleanups.push(() => {
      delete globalWindow.updateMenuPosition;
    });
  }
}

/**
 * WordPress inline scripts share one global scope. Merge them into a single
 * IIFE so cross-script globals keep working, then expose their top-level
 * functions because inline handlers call them by name.
 */
export function runPageScripts({ root, cleanups }: ClonedPageContext) {
  const scripts = Array.from(root.querySelectorAll('script'));
  if (scripts.length) {
    const merged = scripts
      .map((script, index) => {
        const code = script.textContent || '';
        if (!code.trim()) return '';
        return `\n/* page script ${index + 1} */\ntry {\n${code}\n} catch (error) { console.warn('[bydreamy clone] script ${index + 1}', error); }`;
      })
      .join('\n');

    const names = new Set<string>();
    const fnPattern = /(?:^|\n)\s*(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g;
    const varPattern = /(?:^|\n)\s*(?:var|let|const)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function|\()/g;
    for (const pattern of [fnPattern, varPattern]) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(merged))) names.add(match[1]);
    }

    const expose = Array.from(names)
      .map((name) => `try { window[${JSON.stringify(name)}] = ${name}; } catch (error) {}`)
      .join('\n');
    const runner = document.createElement('script');
    runner.dataset.bydreamyRuntime = 'page';
    runner.textContent = `(function(){\n${merged}\n${expose}\n})();`;

    const previous = Array.from(names).map((name) => ({
      name,
      had: Object.prototype.hasOwnProperty.call(window, name),
      value: (window as unknown as Record<string, unknown>)[name],
    }));

    document.body.appendChild(runner);
    scripts.forEach((script) => script.remove());

    cleanups.push(() => {
      runner.remove();
      previous.forEach(({ name, had, value }) => {
        try {
          if (had) (window as unknown as Record<string, unknown>)[name] = value;
          else delete (window as unknown as Record<string, unknown>)[name];
        } catch {
          /* non-configurable globals are left in place */
        }
      });
    });
  }

  const domReady = window.setTimeout(() => {
    try {
      document.dispatchEvent(new Event('DOMContentLoaded', { bubbles: true }));
      window.dispatchEvent(new Event('load'));
    } catch {
      /* noop */
    }
  }, 30);
  cleanups.push(() => window.clearTimeout(domReady));
}
