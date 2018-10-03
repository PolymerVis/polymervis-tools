import * as ts from 'typescript';

import {
    findMatchingDecorators, getDecoratorArguments, IDecoratorVisitor, stripDecorator, Visitor
} from './common';

export class PropertyVisitor extends Visitor implements IDecoratorVisitor {
  public kind = "property";

  constructor(context: ts.TransformationContext) {
    super(context);
  }

  visit(node: ts.Node): ts.VisitResult<ts.Node> {
    if (!ts.isClassDeclaration(node)) {
      return ts.visitEachChild(node, child => this.visit(child), this.context);
    }

    const properties = node.members.filter<ts.PropertyDeclaration>(
      (p): p is ts.PropertyDeclaration => ts.isPropertyDeclaration(p)
    );

    // do nothing if there are no property decorators
    if (properties.filter(prop => !!prop.decorators).length === 0) return node;

    let propertiesGetter = node.members.find<ts.GetAccessorDeclaration>(
      (p): p is ts.GetAccessorDeclaration => {
        return (
          ts.isGetAccessor(p) &&
          p.name.getText() === "properties" &&
          p.modifiers !== undefined &&
          p.modifiers.some(mod => mod.kind === ts.SyntaxKind.StaticKeyword)
        );
      }
    );
    let propertiesGetterObject: ts.ObjectLiteralExpression;
    if (!propertiesGetter) {
      propertiesGetterObject = ts.createObjectLiteral();
      propertiesGetter = ts.createGetAccessor(
        undefined,
        [ts.createModifier(ts.SyntaxKind.StaticKeyword)],
        "properties",
        [],
        undefined,
        ts.createBlock([ts.createReturn(propertiesGetterObject)])
      );
      node.members = ts.createNodeArray([propertiesGetter, ...node.members]);
    } else {
      if (!propertiesGetter.body) {
        return node;
      }

      const getterReturn = propertiesGetter.body.statements.find<
        ts.ReturnStatement
      >(
        (s): s is ts.ReturnStatement => {
          return ts.isReturnStatement(s);
        }
      );

      if (
        !getterReturn ||
        !getterReturn.expression ||
        !ts.isObjectLiteralExpression(getterReturn.expression)
      ) {
        return node;
      }

      propertiesGetterObject = getterReturn.expression;
    }

    const initialPropertyNames = propertiesGetterObject.properties
      .filter(prop => prop.name)
      .map(prop => prop.name!.getText());

    for (const prop of properties) {
      const matchingDecorators = findMatchingDecorators(prop, this.kind);

      if (matchingDecorators.length > 0 && prop.name) {
        const args = getDecoratorArguments(matchingDecorators[0]);
        stripDecorator(prop, this.kind);
        const name = prop.name.getText();
        if (!initialPropertyNames.includes(name)) {
          const propValExpr =
            args.length > 0
              ? args[0]
              : ts.createIdentifier(this.createPropertyType(prop));
          const newProp = ts.createPropertyAssignment(name, propValExpr);
          // add comment from decorator property to "properties"
          const jsDoc = (prop as any).jsDoc;
          const comment = jsDoc && jsDoc.length > 0 && jsDoc[0].comment;
          if (comment) {
            ts.addSyntheticLeadingComment(
              newProp,
              ts.SyntaxKind.MultiLineCommentTrivia,
              comment,
              true
            );
          }
          propertiesGetterObject.properties = ts.createNodeArray(
            [...propertiesGetterObject.properties, newProp],
            true
          );
        }
      }
    }
    return node;
  }

  private createPropertyType(node: ts.PropertyDeclaration): string {
    if (!!node.type) {
      if (ts.isArrayTypeNode(node.type)) {
        return "Array";
      }

      if (
        ts.isTypeReferenceNode(node.type) &&
        node.type.typeName.getText() === "Array"
      ) {
        return "Array";
      }

      if (node.type.kind === ts.SyntaxKind.BooleanKeyword) {
        return "Boolean";
      }

      if (node.type.kind === ts.SyntaxKind.NumberKeyword) {
        return "Number";
      }

      if (node.type.kind === ts.SyntaxKind.StringKeyword) {
        return "String";
      }
    }

    return "Object";
  }
}

export default PropertyVisitor;
