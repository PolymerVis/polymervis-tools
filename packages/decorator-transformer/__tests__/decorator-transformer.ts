import * as ts from 'typescript';

import decoratorTransformer from '../src/index';

function transpile(source: string) {
  return ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ESNext
    },
    transformers: { before: [decoratorTransformer()] }
  }).outputText;
}

describe("ts-transformer", () => {
  it("replace @customElement decorator", () => {
    const source = `
    @customElement('x-foo')
    class XFoo {}`;

    const expected = `class XFoo {
}
customElements.define('x-foo', XFoo);`;

    expect(transpile(source)).toMatch(expected);
  });

  it("replace @property decorator", () => {
    const source = `
    class XFoo {
      @property
      prop1: string;
    }`;

    const expected = `class XFoo {
    static get properties() { return { prop1: String, }; }
}
`;
    expect(transpile(source)).toMatch(expected);
  });

  it("replace @property decorator and insert comment", () => {
    const source = `
    class XFoo {
      /**
       * Some comment 
       */
      @property
      prop1: string;
    }`;

    const expected = `class XFoo {
    static get properties() { return { /*Some comment*/
        prop1: String, }; }
}
`;
    expect(transpile(source)).toMatch(expected);
  });

  it("replace @property decorator with propertyDeclaration instead of type", () => {
    const source = `
    class XFoo {
      @property({type: String, attribute: true, reflect: true})
      prop1: string;
    }`;

    const expected = `class XFoo {
    static get properties() { return { prop1: { type: String, attribute: true, reflect: true }, }; }
}
`;
    expect(transpile(source)).toMatch(expected);
  });
});
