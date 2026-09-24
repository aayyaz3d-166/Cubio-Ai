import { ResearchQuestion } from '../types';
export class ResearchQuestionFormulator {
  public formulate(domain: string, questionText: string, hypothesis: string): ResearchQuestion {
    return Object.freeze({ questionId: 'RQ_' + Date.now(), domain, questionText, hypothesisText: hypothesis, isTestable: true });
  }
}
