import { Buffer } from 'buffer';
import Vinyl from 'vinyl';
import prettierPlugin from './index.ts';

const newFile = (contents, name) => {
  if (! name) name = 'index.js'
  return new Vinyl({
    base: '/src',
    contents: Buffer.from(contents),
    cwd: '/',
    path: `/src/${name}`,
  });
};

const testTransformFile = (plugin, contents, name, callback) => {
  const file = newFile(contents, name);
  plugin._transform(file, 'utf8', callback);
};

const testTransformFileWithName = (plugin, contents, name, callback) => {
  const file = newFile(contents, name);
  plugin._transform(file, 'utf8', callback);
};

const testFlush = (plugin, callback) => {
  plugin._flush(callback);
};

const expectZeroTransformErrors = (err, file) => {
  expect(err).toBeNull();
  expect(file.contents.toString()).toMatchSnapshot();
};

const expectZeroFlushErrors = err => expect(err).toBe(undefined);

const transformWithZeroErrors = (prettierOptions, pluginOptions, contents, name) => {
  const plugin = prettierPlugin(prettierOptions, pluginOptions);
  testTransformFile(plugin, contents, name, expectZeroTransformErrors);
  testFlush(plugin, expectZeroFlushErrors);
};

it('pretty prints javascript code', () => {
  transformWithZeroErrors(
    undefined,
    undefined,
    `let x = 1
      const sum = (a, b) => a - a + a - a + a - a + a + b - b + b - b + b - b + b
      sum(x, 2)`
  );
});

it('pretty prints LESS code', () => {
  transformWithZeroErrors(
    undefined,
    undefined,
`@base: #f938ab;


.box-shadow(@style, @c) when (iscolor(@c)) {
  -webkit-box-shadow: @style    @c;
  box-shadow:         @style   @c;
}
.box-shadow(@style, @alpha: 50%) when (isnumber(@alpha)) {
  .box-shadow(@style, rgba(0, 0, 0, @alpha));
}
.box {
  color: saturate(@base, 5%);
  border-color: lighten(@base, 30%);
  div { .box-shadow(0 0 5px, 30%) }
}
`, 'style.less');
});

it('can pass options to prettier such as trailing commas and single quotes', () => {
  transformWithZeroErrors(
    {
      trailingComma: 'es5',
      singleQuote: true,
    },
    undefined,
    `db.insertarCliente("ruc", "nombre", "direccion", "email", "telefono1", "telefono2", "descDefault")
      .then(function () {//OK!
        res.status(200)
        .send('OK')
      })`
  );
});

it('pretty prints typescript code when the typescript parser is set', () => {
  transformWithZeroErrors(
    {
      parser: 'typescript',
    },
    undefined,
    `const isValidReactElement = (element: string | ReactElement<any> | null): element is ReactElement<any> => {
      return element != null && (element as ReactElement<any>).props !== undefined
    }`
  );
});

it('only pushes files that need formatting if plugin option "filter" is set', () => {
  const plugin = prettierPlugin(undefined, { filter: true });
  const uglyFile =
    'let array = ["JavaScript", "TypeScript", "CoffeeScript", "elm", "Python", "Ruby", "Haskell", "Go"]';
  testTransformFile(plugin, uglyFile, 'test.js', expectZeroTransformErrors);
  const prettyFile = 'let array = ["JavaScript", "TypeScript"];\n';
  testTransformFile(plugin, prettyFile, 'test2.js', (err, file) => {
    expect(err).toBe(null);
    expect(file).toBe(null);
  });
  testFlush(plugin, expectZeroFlushErrors);
});

it('calls flush callback with error when plugin option validate is set and files that need formatting are found', () => {
  const plugin = prettierPlugin(undefined, { validate: true });
  const uglyFile =
    'let array = ["JavaScript", "TypeScript", "CoffeeScript", "elm", "Python", "Ruby", "Haskell", "Go"]';
  testTransformFile(plugin, uglyFile, 'index.js', expectZeroTransformErrors);
  const prettyFile = 'let array = ["JavaScript", "TypeScript"];\n';
  testTransformFile(plugin, prettyFile, 'index.js', expectZeroTransformErrors);
  testFlush(plugin, err => expect(err).toMatchSnapshot());
});

it('calls transform callback with error when a non-buffer vinyl is passed', () => {
  const plugin = prettierPlugin();
  const streamFile = new Vinyl({
    base: '/src',
    contents: process.stdin,
    cwd: '/',
    path: '/src/index.js',
  });
  plugin._transform(streamFile, 'utf8', err => expect(err).toMatchSnapshot());
  testFlush(plugin, expectZeroFlushErrors);
});
