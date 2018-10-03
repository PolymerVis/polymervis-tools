/**
 * Typescript transformer to replace the lit-element `property` and `customelement` decorators.
 *
 * Original source: https://github.com/Polymer/lit-element/pull/145
 * Modified by: eterna2 <eterna2@hotmail.com>
 */
import * as ts from 'typescript';

import CustomElementVisitor from './customelement-visitor';
import PropertyVisitor from './property-visitor';

/**
 * Typescript factory method that creates a transformer method. Replace `property` and
 * `customelement` decorators with the appropriate javascripts.
 */
export function decoratorTransformer<
  T extends ts.Node
>(): ts.TransformerFactory<T> {
  return context => {
    const visitors = [
      new CustomElementVisitor(context),
      new PropertyVisitor(context)
    ];

    const visit: ts.Visitor = node => {
      let result: ts.VisitResult<ts.Node> = node;

      for (const visitor of visitors) {
        if (!result) {
          break;
        }

        if (Array.isArray(result)) {
          // What do? some kinda recursion probably needs to go on here
          break;
        }

        result = visitor.visit(result);
      }
      return result;
    };

    return node => ts.visitNode(node, visit);
  };
}

export default decoratorTransformer;
