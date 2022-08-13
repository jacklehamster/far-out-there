import { evaluate } from "mathjs";

export default class Condition {
  type = "condition";
  formula: string;
  yes: any;
  no: any;

  constructor({ formula, yes, no }: { formula: string, yes?: any, no?: any }) {
    this.formula = formula;
    this.yes = yes ?? true;
    this.no = no ?? false;
  }

  evaluate(params: any): any {
    return evaluate(this.formula, params) ? this.yes : this.no;
  }

  toJSON() {
    return {
      "type": "condition",
      "formula": this.formula,
    };
  }

  static eval(expression: any | Condition, params: any): any {
    if (expression instanceof Condition) {
      return (expression as Condition).evaluate(params);
    }
    return expression;
  }
}