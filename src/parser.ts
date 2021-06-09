import { Parser } from "binary-parser";

/**
 * Set of parsers for the data structures in a UE4 `pak` file.
 * 
 * @remarks It is only recommended to use this parser directly in special use cases. 
 * @remarks The {@link PakFileReader} is recommended for reading/parsing PAK files directly (simpler for most scenarios).
 */
export class ParserService {
    private _encoding: string;
    /**
     * Creates a new parser service.
     * @param encoding Optionally override the default text encoding used for paths/names ('utf8')
     */
    constructor(encoding?: string) {
        this._encoding = encoding ?? 'utf8';
    }

    private get compressionBlock() {
        return new Parser()
            .endianess('little')
            .uint64('startBlock')
            .uint64('endblock');
    }

    private get stop() {
        return new Parser();
    }
    
    /**
     * Gets a parser used for the compression-specific data in an index record
     * 
     * @remarks This includes the block count and blocks themselves.
     */
    public get compressionParser() {
        var compressionParser = new Parser()
            .endianess('little')
            .uint32("blockCount")
            .array("blocks", {
                type: this.compressionBlock,
                length: "blockCount"
            });
        return compressionParser;
    }

    /**
     * Gets a parser for reading a generic record from a PAK file.
     */
    public get recordParser() {
        var recordParser = new Parser()
            .namely('self')
            .endianess("little")
            .uint64("offset")
            .uint64("size")
            .uint64("rawSize")
            .uint32("compressionMethod")
            .string("hash", { encoding: "hex", length: 20 })
            .choice("compression", {
                tag: "compressionMethod",
                choices: {
                    0: this.stop,
                    1: this.compressionParser
                }
            })
            .bit1("isEncrypted")
            .uint32("compressionBlockSize");
        return recordParser;
    }

    /**
     * Gets a parser for reading index records from a PAK file index block.
     * 
     * @remarks This is specifically for index records, not data records or generic records.
     */
    public get indexRecordParser() {
        return new Parser()
            .namely('self')
            .endianess('little')
            .uint32("fileNameSize")
            .string("fileName", {
                encoding: this._encoding,
                stripNull: true as null,
                length: function() {
                    return this.fileNameSize - 1;
                }
            })
            .seek(1)
            .nest(null, { type: this.recordParser });
    }

    /**
     * Gets a parser that can read the entire index block from a PAK file footer.
     * 
     * @remarks This parser includes the results of the {@link indexRecordParser}. Do not call them separately.
     */
    public get indexParser() {
        return new Parser()
            .endianess('little')
            .uint32("mountPointSize")
            .string("mountPoint", {
                encoding: this._encoding,
                stripNull: true as null, 
                // length: function() {
                //     return this.mountPointSize - 1;
                // },
                length: "mountPointSize"
            })
            .uint32("recordCount")
            .array("records", {
                length: "recordCount",
                type: this.indexRecordParser
            });
    }

    /**
     * Gets a parser that can read the file footer for a PAK file.
     */
    public get footerParser() {
        return new Parser()
            .endianess('little')
            //.string("magic", { encoding: 'hex', lengthInBytes: 4 })
            .string("magic", { encoding: 'hex', length: 4 })
            .uint32("archiveVersion", { assert: 3 })
            .uint64("indexOffset")
            .uint64("indexSize")
            .string("indexHash", { encoding: "hex", length: 20 });
    }

    /**
     * Gets a parser that attempts to read the file footer and file index together.
     * 
     * @experimental
     * @param fileLength The total length of the PAK file.
     * @returns A parser for all the available metadata in a PAK file.
     */
    public getPakFileParser(fileLength: number) {
        return new Parser()
            .endianess("little")
            .seek(fileLength - 44)
            // .string("magic", { encoding: 'hex', lengthInBytes: 4 })
            .string("magic", { encoding: 'hex', length: 4 })
            .uint32("archiveVersion", { assert: 3 })
            .uint64("indexOffset")
            .uint64("indexSize")
            .string("hash", { encoding: "hex", length: 20 })
            .pointer("index", { type: this.indexParser, offset: "indexOffset" });
    }
}