(() => {
  'use strict';

  const timers = new WeakMap();
  const signatures = new Map();
  const escNumber = value => Number.isFinite(Number(value)) ? Number(value) : 0;

  function activeTopic() {
    const id = new URLSearchParams(location.search).get('topic');
    return window.GCSE_COURSE_DATA?.topics?.find?.(topic => topic.id === id) || null;
  }

  function questionPayload(card) {
    const topic = activeTopic();
    if (!topic || !card) return null;
    const prompt = card.querySelector('h4')?.textContent?.trim() || '';
    if (!prompt) return null;
    const markText = [...card.querySelectorAll('header span')].at(-1)?.textContent || '';
    const maxMarks = Math.max(1, escNumber(markText.match(/\d+/)?.[0]));
    const score = Math.max(0, Math.min(maxMarks, escNumber(card.querySelector('[data-question-score]')?.textContent)));
    const answer = card.querySelector('[data-exam-answer]')?.value || '';
    const marking = [...card.querySelectorAll('[data-mark-point]')].map(box => box.closest('label')?.querySelector('span')?.textContent?.trim()).filter(Boolean);
    const modelAnswer = card.querySelector('.exam-model-answer p')?.textContent?.trim() || '';
    const id = `${topic.id}:${card.dataset.examQuestion || prompt}`;
    return {
      topicId: topic.id,
      score,
      maxMarks,
      source: 'exam-studio',
      answer,
      question: {
        id,
        prompt,
        marking,
        modelAnswer
      }
    };
  }

  function publish(card) {
    const payload = questionPayload(card);
    if (!payload) return;
    const signature = `${payload.score}/${payload.maxMarks}|${payload.answer.trim()}|${payload.question.marking.join('|')}`;
    if (signatures.get(payload.question.id) === signature) return;
    signatures.set(payload.question.id, signature);
    window.dispatchEvent(new CustomEvent('gcse-performance-record', { detail: payload }));
  }

  function schedule(card) {
    clearTimeout(timers.get(card));
    timers.set(card, setTimeout(() => publish(card), 1800));
  }

  document.addEventListener('change', event => {
    if (!event.target.matches?.('[data-mark-point], [data-teacher-score]')) return;
    const card = event.target.closest('.exam-studio-question');
    if (card) schedule(card);
  });

  document.addEventListener('input', event => {
    if (!event.target.matches?.('[data-teacher-score]')) return;
    const card = event.target.closest('.exam-studio-question');
    if (card) schedule(card);
  });

  window.GCSE_EXAM_STUDIO_REVISION_BRIDGE = { publish, questionPayload };
})();
