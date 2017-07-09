import { Buffer } from 'buffer';
import { PluginError } from 'gulp-util';
import * as prettier from 'prettier';
import { Transform } from 'stream';
import * as Vinyl from 'vinyl';

const getPrettierSourceCode = (sourceCode: string, options): string | null => {
  if (prettier.check(sourceCode, options)) return null;
  else return prettier.format(sourceCode, options);
};

const createValidationError = (uglyFilesStr: string): PluginError => {
  return new PluginError(
    'gulp-prettier-plugin',
    'The following files have not been formatted with prettier:\n\n' +
      uglyFilesStr,
  );
};

export interface IPrettierPluginOptions {
  filter?: boolean;
  validate?: boolean;
}

export class PrettierTransform extends Transform {
  private prettierOptions: any;
  private pluginOptions: IPrettierPluginOptions | undefined;
  private uglyFilesStr: string;

  constructor(
    prettierOptions: any,
    pluginOptions: IPrettierPluginOptions | undefined,
  ) {
    super({ objectMode: true });
    this.prettierOptions = prettierOptions;
    this.pluginOptions = pluginOptions;
    this.uglyFilesStr = '';
  }

  public _transform(
    inputFile: Vinyl,
    encoding: string,
    callback: (Error, Vinyl) => void,
  ) {
    if (inputFile.isBuffer()) this.transformBuffer(inputFile, callback);
    else this.throwNotBufferError(callback);
  }

  public _flush(callback: (Error) => void) {
    const { uglyFilesStr, pluginOptions } = this;
    const validate = pluginOptions && pluginOptions.validate;
    let err: Error | undefined;
    if (validate && uglyFilesStr.length > 0)
      err = createValidationError(uglyFilesStr);
    callback(err);
  }

  private transformBuffer(inputFile: Vinyl, callback: (Error, Vinyl) => void) {
    const { _contents } = inputFile;
    const code = _contents.toString();
    const prettierOptions = this.prettierOptions;
    const prettierSourceCode = getPrettierSourceCode(code, prettierOptions);
    const outputFile = this.createOutputFile(prettierSourceCode, inputFile);
    callback(null, outputFile);
  }

  private throwNotBufferError(callback: (Error, Vinyl) => void) {
    const err = new PluginError(
      'gulp-prettier-plugin',
      'this plugin only suppports buffers.',
    );
    callback(err, null);
  }

  private appendUglyFiles(path: string) {
    this.uglyFilesStr += `- ${path} \n`;
  }

  private createOutputFile(
    transformedCode: string | null,
    inputFile: Vinyl,
  ): Vinyl | null {
    const outputFile = inputFile.clone();
    const filter = this.pluginOptions && this.pluginOptions.filter;
    if (transformedCode === null && filter) return null;
    else if (transformedCode === null) return inputFile;
    else {
      this.appendUglyFiles(inputFile.path);
      outputFile._contents = Buffer.from(transformedCode);
      return outputFile;
    }
  }
}

const prettierPlugin = (
  prettierOptions: any,
  pluginOptions: IPrettierPluginOptions | undefined,
) => new PrettierTransform(prettierOptions, pluginOptions);

module.exports = prettierPlugin;
