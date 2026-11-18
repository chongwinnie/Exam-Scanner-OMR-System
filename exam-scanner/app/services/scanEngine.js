import { runOMR } from './omrEngine';
import { scoreAnswerSheet } from './scoringEngine';

export class ScanEngine {
  constructor(answerKeys) {
    this.answerKeys = answerKeys;
  }

  scan(card) {
    const omr = runOMR(card.image);

    // ⭐ 重点：有异常就直接返回
    if (omr.hasException) {
      return {
        status: 'EXCEPTION',
        detail: omr
      };
    }

    const scored = scoreAnswerSheet(
      omr.answers,
      this.answerKeys,
      card.paper_version
    );

    return {
      status: 'OK',
      result: scored
    };
  }
}
