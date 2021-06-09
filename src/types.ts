export interface IPakFile extends IFileFooter {
    index: IIndex;
}

export interface IFileFooter {
    archiveVersion: number;
    magic: string;
    indexOffset: bigint;
    indexSize: bigint;
    indexHash: string;
}

export interface IIndex {
    mountPoint: string;
    mountPointSize: number;
    recordCount: number;
    records: IIndexRecord[];
}

export interface IIndexRecord extends IRecord  {
    fileName: string;
}

export interface IRecord {
    offset: number;
    size: number;
    rawSize: number;
    compressionMethod: number;
    hash: string;
    /**
     * Encryption status of the file: `0` for unencrypted, `1` for encrypted
     */
    isEncrypted: number;
    compressionBlockSize: number;
    compression: ICompression;
}

interface ICompression {
    blockCount: number;
    blocks: {startBlock: number, endBlock: number}[]
}