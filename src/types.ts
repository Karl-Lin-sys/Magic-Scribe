export interface Suggestion {
  targetText: string;
  suggestion: string;
  reason: string;
}

export interface SelectionRange {
  start: number;
  end: number;
  text: string;
  rect?: DOMRect;
}
