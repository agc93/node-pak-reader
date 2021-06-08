/**
 * To get started reading and parsing a PAK file, create a new {@link PakFileReader} instance as outlined in the README.
 * 
 * The parsers used by {@link PakFileReader} (created with [binary-parser](https://www.npmjs.com/package/binary-parser)) are available (for low-level usage) in the {@link ParserService}.
 * 
 * @module
 */
export * from './fileReader';
export * from './types';
export {ParserService} from './parser'