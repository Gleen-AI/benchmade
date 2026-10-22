/* Benchmade Knife Finder: run ONLY in Visually's TEST variant.
 * Target /pages/knife-finder. Reuses the store's existing Alhena SDK.
 * Does not install the SDK, overwrite its settings, or assign experiment groups.
 */
(function () {
  'use strict';

  if (!/^\/pages\/knife-finder\/?$/.test(window.location.pathname)) return;
  if (window.__benchmadeAlhenaQuizVariantStarted) return;
  window.__benchmadeAlhenaQuizVariantStarted = true;

  const quizUrl = 'https://benchmade-9c8f406672.alhena-studio.pages.dev/';
  const oldQuizSelector = '.benchmade-finder-embed';
  const slotId = 'alhena-quiz-slot';
  const timeoutMs = 20000;
  let slot;
  let ownsMount = false;
  let cancelled = false;

  function waitFor(check, description) {
    const deadline = Date.now() + timeoutMs;
    return new Promise(function (resolve, reject) {
      function poll() {
        try {
          const value = check();
          if (value) return resolve(value);
          if (cancelled) throw new Error('Variant cancelled');
          if (Date.now() >= deadline) throw new Error(description + ' timed out');
          setTimeout(poll, 100);
        } catch (error) {
          reject(error);
        }
      }
      poll();
    });
  }

  async function activate() {
    const oldQuiz = await waitFor(function () {
      return document.querySelector(oldQuizSelector);
    }, 'Existing quiz container');

    // Keep a usable control quiz visible throughout SDK/quiz loading.
    // If the visitor starts it while we wait, avoid replacing their answers.
    function keepCurrentQuiz() { cancelled = true; }
    oldQuiz.addEventListener('pointerdown', keepCurrentQuiz, { once: true, capture: true });
    oldQuiz.addEventListener('keydown', keepCurrentQuiz, { once: true, capture: true });

    try {
      await waitFor(function () {
        // The initial SDK exposes a no-op stub; wait for the real bundle too.
        return window._alhenaChatAppLoaded === true &&
          typeof window.gleenWidget?.initializeStudioPages === 'function';
      }, 'Alhena SDK');
      if (cancelled) throw new Error('Visitor already started the existing quiz');
      if (!oldQuiz.isConnected) throw new Error('Existing quiz container was replaced');

      slot = document.getElementById(slotId);
      if (slot && (slot.shadowRoot || slot.hasAttribute('data-alhena-page') || slot.childElementCount)) {
        throw new Error('Quiz slot is already in use');
      }
      if (!slot) {
        slot = document.createElement('div');
        slot.id = slotId;
      }
      slot.style.setProperty('display', 'none', 'important');
      slot.setAttribute('aria-label', 'Benchmade Knife Finder');
      oldQuiz.before(slot);
      ownsMount = true;
      slot.setAttribute('data-alhena-page', quizUrl);

      // Mount errors may be logged internally, so check the actual quiz DOM.
      Promise.resolve(window.gleenWidget.initializeStudioPages()).catch(function () {
        cancelled = true;
      });
      await waitFor(function () {
        return slot.shadowRoot?.querySelector('#options button[data-choice]');
      }, 'Alhena quiz');
      if (cancelled) throw new Error('Existing quiz retained');
      if (!slot.isConnected || !oldQuiz.isConnected) throw new Error('Quiz container was replaced');

      slot.hidden = false;
      slot.style.setProperty('display', 'block', 'important');
      oldQuiz.style.setProperty('display', 'none', 'important');
      // Refresh carousel geometry after mounting in the hidden slot.
      window.dispatchEvent(new Event('resize'));
      console.info('[Benchmade quiz] Alhena variant displayed');
    } finally {
      oldQuiz.removeEventListener('pointerdown', keepCurrentQuiz, true);
      oldQuiz.removeEventListener('keydown', keepCurrentQuiz, true);
    }
  }

  activate().catch(function (error) {
    // Leave a failed mount hidden, including if its scripts finish late.
    // Do not automatically retry: Studio page scripts cannot be unloaded.
    if (ownsMount) {
      slot.style.setProperty('display', 'none', 'important');
    }
    console.warn('[Benchmade quiz] Keeping the existing quiz:', error.message);
  });
}());
