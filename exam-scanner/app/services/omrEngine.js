export function runOMR(image) {
  const answers = image.mockAnswers || [];
  const exceptions = [];

  answers.forEach((a, i) => {
    const q = i + 1;
    if (Array.isArray(a)) {
      exceptions.push({ q, type: 'MULTIPLE_ANSWER' });
    }
    if (a === null || a === undefined || a === '') {
      exceptions.push({ q, type: 'BLANK' });
    }
  });

  return {
    answers,
    hasException: exceptions.length > 0,
    exceptions
  };
}
