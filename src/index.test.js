import { Buffer } from 'buffer';
import Vinyl from 'vinyl';
import prettierPlugin from './index.ts';

const newFile = contents => {
  return new Vinyl({
    base: '/src',
    contents: Buffer.from(contents),
    cwd: '/',
    path: '/src/index.js',
  });
};

const testTransformFile = (plugin, contents, callback) => {
  const file = newFile(contents);
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

const transformWithZeroErrors = (prettierOptions, pluginOptions, contents) => {
  const plugin = prettierPlugin(prettierOptions, pluginOptions);
  testTransformFile(plugin, contents, expectZeroTransformErrors);
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
  testTransformFile(plugin, uglyFile, expectZeroTransformErrors);
  const prettyFile = 'let array = ["JavaScript", "TypeScript"];\n';
  testTransformFile(plugin, prettyFile, (err, file) => {
    expect(err).toBe(null);
    expect(file).toBe(null);
  });
  testFlush(plugin, expectZeroFlushErrors);
});

it('calls flush callback with error when plugin option validate is set and files that need formatting are found', () => {
  const plugin = prettierPlugin(undefined, { validate: true });
  const uglyFile =
    'let array = ["JavaScript", "TypeScript", "CoffeeScript", "elm", "Python", "Ruby", "Haskell", "Go"]';
  testTransformFile(plugin, uglyFile, expectZeroTransformErrors);
  const prettyFile = 'let array = ["JavaScript", "TypeScript"];\n';
  testTransformFile(plugin, prettyFile, expectZeroTransformErrors);
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
