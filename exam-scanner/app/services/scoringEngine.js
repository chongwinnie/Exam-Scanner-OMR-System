// app/services/scoringEngine.js

let scoringRules = {}; 
// e.g. { 5: ['A','B'] }

export function setScoringRule(questionNo, acceptedAnswers) {
  scoringRules[questionNo] = acceptedAnswers;
}

export function clearScoringRules() {
  scoringRules = {};
}

export function scoreAnswerSheet(answers, answerKeyByPaper, paperVersion) {
  const key = answerKeyByPaper[paperVersion] || [];
  let correct = 0;

  answers.forEach((a, i) => {
    const qNo = i + 1;

    // ⭐ 核心：如果有事后规则，用规则
    const rule = scoringRules[qNo];
    const accepted = rule ?? [key[i]];

    if (accepted.includes(a)) correct++;
  });

  return {
    correctCount: correct,
    score: `${correct}/${answers.length}`
  };
}
