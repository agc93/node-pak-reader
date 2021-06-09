import fs, {promises as pfs} from "fs";
import readChunk from "read-chunk";
import { ParserService } from "./parser";
import { SafeParserService } from "./safeParser";
import { IFileFooter, IIndex, IPakFile } from "./types";

/**
 * Options object to control reader behaviour.
 */
export interface PakFileReaderOptions {
    /**
     * Text encoding of strings in the file. Only change if absolutely necessary.
     */
    encoding?: string;
    /**
     * Switches the reader to using a safer, but less performant, pre-compiled parser.
     * 
     * Use this in environments where `unsafe-eval` is blocked/unavailable.
     */
    safeMode?: boolean;
}

/**
 * The main reader implementation, intended for reading the records from a single PAK file.
 */
export class PakFileReader {
    private _filePath: string;
    private _parser: ParserService;
    private _safeMode: boolean;
    private _safeParser: SafeParserService;

    /**
     * Creates a new instance of the `PakFileReader` for the PAK file at the given path.
     * 
     * @remarks Changing the encoding is not recommended unless you really know what you're doing.
     * 
     * @param filePath Path to the PAK file to read.
     * @param opts Options for fine-tuning the reader and parser behaviour.
     */
    constructor(filePath: string, opts?: PakFileReaderOptions) {
        this._filePath = filePath;
        var encoding = opts?.encoding ?? 'utf8';
        this._parser = new ParserService(encoding);
        this._safeParser = new SafeParserService();
        this._safeMode = opts?.safeMode ?? false;
    }

    /**
     * Parses the footer and index records of the current file.
     * 
     * @returns An object for the records and metadata of the current PAK file.
     */
    parse = async(): Promise<IPakFile> => {
        var fp = this._safeMode ? this._safeParser.footerParser : this._parser.footerParser.parse;
        var ip = this._safeMode ? this._safeParser.indexParser : this._parser.indexParser.parse;
        var footerBytes = await this.getFooterBytes();
        var footer = fp(footerBytes) as IFileFooter;
        var rawIndex = await readChunk(this._filePath, Number(footer.indexOffset), Number(footer.indexSize));
        var index = ip(rawIndex);
        return{
            ...footer,
            index
        };
    }

    private getFooterBytes = async (): Promise<Buffer> => {
        var fstat = await pfs.stat(this._filePath);
        var totalSize = fstat.size;
        var footerBytes = await readChunk(this._filePath, totalSize - 44, 44);
        return footerBytes;
    }

    private getFileBuffer = (filePath: string): Buffer => {
        if (fs.existsSync(filePath)) {
            return fs.readFileSync(filePath);
        }
    }

    private readString = (rawData: Buffer, startOffset: number = 0): {value: string, lenBytes: number} => {
        var strLength = rawData.readUInt32LE(startOffset);
        var str = rawData.toString('utf8', startOffset + 4, startOffset + 4 + strLength);
        return {lenBytes: strLength + 4, value: str};
    }
}

