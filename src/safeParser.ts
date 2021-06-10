import { TextDecoder } from "util";
import { IFileFooter, IIndex } from "./types";

/**
 * A limited set of less-performant parsers for the data structures in a UE4 `pak` file.
 * 
 * @remarks This parser is only used when a {@link PakFileReader} is running in safe mode.
 * @remarks The {@link PakFileReader} is recommended for reading/parsing PAK files directly (simpler for most scenarios).
 */
export class SafeParserService {
    /**
     * Gets a parser that can read the file footer for a PAK file.
     */
    public get footerParser() {
        return (buffer: Buffer) => {
            var dataView = new DataView(buffer.buffer, buffer.byteOffset, buffer.length);
            var offset = 0;
            var vars: Partial<IFileFooter> = {};
            vars.magic = Array.from(buffer.subarray(offset, offset + 4), b => b.toString(16).padStart(2, "0")).join('');
            offset += 4;
            vars.archiveVersion = dataView.getUint32(offset, true);
            offset += 4;
            if (3 !== vars.archiveVersion) {
                throw new Error("Assert error: vars.archiveVersion is " + 3);
            }
            vars.indexOffset = dataView.getBigUint64(offset, true);
            offset += 8;
            vars.indexSize = dataView.getBigUint64(offset, true);
            offset += 8;
            vars.indexHash = Array.from(buffer.subarray(offset, offset + 20), b => b.toString(16).padStart(2, "0")).join('');
            offset += 20;
            return vars;
        }
    }

    /**
     * Gets a parser that can read the entire index block from a PAK file footer.
     * 
     * @remarks This parser includes the results of the {@link indexRecordParser}. Do not call them separately.
     */
    public get indexParser() {
        return (buffer: Buffer) => {
            var dataView = new DataView(buffer.buffer, buffer.byteOffset, buffer.length);
            var offset = 0;
            var vars: Partial<IIndex> = {};
            vars.mountPointSize = dataView.getUint32(offset, true);
            offset += 4;
            vars.mountPoint = new TextDecoder('utf8').decode(buffer.subarray(offset, offset + vars.mountPointSize));
            offset += vars.mountPointSize;
            vars.mountPoint = vars.mountPoint.replace(/\x00+$/g, '')
            vars.recordCount = dataView.getUint32(offset, true);
            offset += 4;
            vars.records = [];
            for (var $tmp1 = vars.recordCount; $tmp1 > 0; $tmp1--) {
                var $tmp2: any = {};
                $tmp2.fileNameSize = dataView.getUint32(offset, true);
                offset += 4;
                $tmp2.fileName = new TextDecoder('utf8').decode(buffer.subarray(offset, offset + ($tmp2.fileNameSize -1)));
                offset += ($tmp2.fileNameSize -1);
                $tmp2.fileName = $tmp2.fileName.replace(/\x00+$/g, '')
                offset += 1;
                $tmp2.offset = dataView.getBigUint64(offset, true);
                offset += 8;
                $tmp2.size = dataView.getBigUint64(offset, true);
                offset += 8;
                $tmp2.rawSize = dataView.getBigUint64(offset, true);
                offset += 8;
                $tmp2.compressionMethod = dataView.getUint32(offset, true);
                offset += 4;
                $tmp2.hash = Array.from(buffer.subarray(offset, offset + 20), b => b.toString(16).padStart(2, "0")).join('');
                offset += 20;
                $tmp2.compression = {};
                switch ($tmp2.compressionMethod) {
                    case 0:
                        break;
                    case 1:
                    case 2:
                    case 4:
                        $tmp2.compression.blockCount = dataView.getUint32(offset, true);
                        offset += 4;
                        $tmp2.compression.blocks = [];
                        for (var $tmp5 = $tmp2.compression.blockCount; $tmp5 > 0; $tmp5--) {
                            var $tmp6: any = {};
                            $tmp6.startBlock = dataView.getBigUint64(offset, true);
                            offset += 8;
                            $tmp6.endblock = dataView.getBigUint64(offset, true);
                            offset += 8;
                            $tmp2.compression.blocks.push($tmp6);
                        }
                        break;
                    default:
                        throw new Error("Met undefined tag value " + $tmp2.compressionMethod + " at choice");
                }
                var $tmp7 = dataView.getUint8(offset);
                offset += 1;
                $tmp2.isEncrypted = $tmp7 >> 0 & 1;
                $tmp2.compressionBlockSize = dataView.getUint32(offset, true);
                offset += 4;
                vars.records.push($tmp2);
            }
            return vars;
        }
    }
}