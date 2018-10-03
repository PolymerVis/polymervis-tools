# `@polymer-vis/decorator-transformer`

Replace `PolymerElement` or `LitElement` decorators (`@customElement`, `@property`) in your typescript codes.

**Before**

```ts
@customElement("x-foo")
class XFoo extends HTMLElement {
  static get properties() {
    return {};
  }

  /** some comment */
  @property
  public a: string;
}
```

**After**

```js
class XFoo {
  static get properties() {
    return {
      /*Some comment*/
      prop1: String
    };
  }
}
customElements.define("x-foo", XFoo);
```

> TODO:
>
> - Fix error when `declaration` is `true` if `properties` is not declared.
> - Fix output formatting.

## Usage

```bash
npm i -D @polymer-vis/decorator-transformer
```

### Important Note

If `declaration` for your `tsconfig.json` is set to `true`, you MUST include the `properties` getAccessor in your class:

```js
class SomeElement {
  @property
  prop1: string;

  // this must be include if u are emitting
  // type declaration.
  static get properties() {
    return {};
  }
}
```

### With [ttypescript](https://github.com/cevek/ttypescript)

Update your `tsconfig.json` with `@polymer-vis/decorator-transformer` plugin.
Then run `ttsc` to compile your typescript sources.

```json
{
  "compilerOptions": {
    "plugins": [
      { "transform": "@polymer-vis/decorator-transformer", "type": "config" }
    ]
  }
}
```

### With [typescript compiler API](https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API)

```js
import * as ts from "typescript";
import decoratorTransformer from "@polymer-vis/decorator-transformer";

let source = `
@customElement('x-foo')
class XFoo extends HTMLElement {
  static get properties() { return {}; }

  @property
  public a: string;

  @property
  public b: number;

  @property
  public c: boolean;

  @property
  public d: string[];

  @property
  public e: Array<Date>;

  @property
  public f: object;

  public g: string;
}
`;
let result = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
  transformers: { before: [decoratorTransformer()] }
});

console.log(result.outputText);
```

## Credits

The source codes are originally by [43081j](https://github.com/43081j) at [lit-element PR#145](https://github.com/Polymer/lit-element/pull/145). I made some minor improvements to replace `@property` with the corresponding comment and property declarations (if present).
