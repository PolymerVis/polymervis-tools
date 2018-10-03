import * as ts from 'typescript';

export interface IDecoratorVisitor {
  kind: string;
}

export abstract class Visitor {
  protected context: ts.TransformationContext;

  constructor(context: ts.TransformationContext) {
    this.context = context;
  }

  abstract visit(node: ts.Node): ts.VisitResult<ts.Node>;
}

export function stripDecorator(node: ts.Node, name: string): ts.Node {
  if (!node.decorators) {
    return node;
  }

  const newDecorators = node.decorators.filter(
    d => getDecoratorName(d) !== name
  );

  node.decorators =
    newDecorators.length > 0 ? ts.createNodeArray(newDecorators) : undefined;

  return node;
}

export function getDecoratorName(decorator: ts.Decorator): string {
  if (ts.isCallExpression(decorator.expression)) {
    return decorator.expression.expression.getText();
  }
  return decorator.expression.getText();
}

export function findMatchingDecorators(
  node: ts.Node,
  name: string
): ts.Decorator[] {
  const decorators = node.decorators;

  if (!decorators) {
    return [];
  }

  const matchingDecorators = decorators.filter(
    d => name === getDecoratorName(d)
  );

  return matchingDecorators;
}

export function getDecoratorArguments(
  decorator: ts.Decorator
): ts.Expression[] {
  if (ts.isCallExpression(decorator.expression)) {
    return [...decorator.expression.arguments];
  }
  return [];
}
