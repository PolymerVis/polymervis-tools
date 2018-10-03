import * as ts from 'typescript';

import {
    findMatchingDecorators, getDecoratorArguments, IDecoratorVisitor, stripDecorator, Visitor
} from './common';

export class CustomElementVisitor extends Visitor implements IDecoratorVisitor {
  public kind = "customElement";

  constructor(context: ts.TransformationContext) {
    super(context);
  }

  visit(node: ts.Node): ts.VisitResult<ts.Node> {
    if (!ts.isClassDeclaration(node) || !node.name) {
      return ts.visitEachChild(node, child => this.visit(child), this.context);
    }

    const matchingDecorators = findMatchingDecorators(node, this.kind);

    if (matchingDecorators.length === 0) {
      return node;
    }

    stripDecorator(node, this.kind);

    const args = getDecoratorArguments(matchingDecorators[0]);

    if (args.length === 0) {
      return node;
    }

    const name = args[0];
    const defineCall = ts.createStatement(
      ts.createCall(
        ts.createPropertyAccess(
          ts.createIdentifier("customElements"),
          ts.createIdentifier("define")
        ),
        undefined,
        [name, node.name]
      )
    );

    return [node, defineCall];
  }
}

export default CustomElementVisitor;
