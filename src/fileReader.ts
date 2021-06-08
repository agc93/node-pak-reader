import fs, {promises as pfs} from "fs";
import readChunk from "read-chunk";
import { ParserService } from "./parser";
import { IFileFooter, IIndex, IPakFile } from "./types";

/**
 * The main reader implementation, intended for reading the records from a single PAK file.
 */
export class PakFileReader {
    private _filePath: string;
    private _parser: ParserService;

    /**
     * Creates a new instance of the `PakFileReader` for the PAK file at the given path.
     * 
     * @remarks Changing the encoding is not recommended unless you really know what you're doing.
     * 
     * @param filePath Path to the PAK file to read.
     * @param encoding Text encoding of strings in the file. Only change if absolutely necessary.
     */
    constructor(filePath: string, encoding: string = 'utf8') {
        this._filePath = filePath;
        this._parser = new ParserService(encoding);
    }

    /**
     * Parses the footer and index records of the current file.
     * 
     * @returns An object for the records and metadata of the current PAK file.
     */
    parse = async(): Promise<IPakFile> => {
        var ps = this._parser;
        var footerBytes = await this.getFooterBytes();
        var fp = ps.footerParser;
        var footer = fp.parse(footerBytes) as IFileFooter;
        var rawIndex = await readChunk(this._filePath, Number(footer.indexOffset), Number(footer.indexSize));
        var index = ps.indexParser.parse(rawIndex);
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



    /**
     * Reads and parses the file footer for the current PAK file.
     * 
     * @deprecated May be removed in future versions. Use `parse()` instead.
     */
    getFooter = async (): Promise<IFileFooter> => {
        var footerBytes = await this.getFooterBytes();
        var magic = footerBytes.readUInt32LE(0);
        if (magic != 0x5A6F12E1) {
            throw new Error("Incorrect magic found!");
        }
        var pakVersion = footerBytes.readUInt32LE(4);
        if (pakVersion != 3) {
            throw new Error("Unsupported PAK version!");
        }
        var indexOffset = footerBytes.readBigUInt64LE(8);
        var indexSize = footerBytes.readBigUInt64LE(16);
        return {
            archiveVersion: pakVersion,
            indexOffset: indexOffset,
            indexSize: indexSize
        };
    }
}

