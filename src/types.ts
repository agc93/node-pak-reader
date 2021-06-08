export interface IPakFile extends IFileFooter {
    index: IIndex;
}

export interface IFileFooter {
    archiveVersion: number;
    indexOffset: bigint;
    indexSize: bigint;
}

export interface IIndex {
    mountPoint: string;
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
    isEncrypted: boolean;
    compressionBlockSize: number;
    compression: ICompression;
}

interface ICompression {
    blockCount: number;
    blocks: {startBlock: number, endBlock: number}[]
}