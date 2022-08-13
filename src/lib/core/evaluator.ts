import { evaluate } from "mathjs";

export default class Evaluation {
  type = "evaluation";
  formula: string;

  constructor({ formula }: { formula: string }) {
    this.formula = formula;
  }

  evaluate(params: any): any {
    return evaluate(this.formula, params);
  }

  toJSON() {
    return {
      "type": this.type,
      "formula": this.formula,
    };
  }

  static eval(expression: any | Evaluation, params: any): any {
    if (expression instanceof Evaluation) {
      return (expression as Evaluation).evaluate(params);
    }
    return expression;
  }
}