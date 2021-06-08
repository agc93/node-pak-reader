# `node-pak-reader`

> A lightweight record reader for UE4 pak files.

## Installation and Usage

Install with `npm i @agc93/pak-reader` and import the PAK reader with:

```ts
import { PakFileReader } from "@agc93/pak-reader";
```

Create a new reader instance with the path to the PAK file, then call `parse` to read the PAK file's index records:

```ts
var reader = new PakFileReader("X:/path/to/mod_P.pak");
var parsed = await reader.parse();
console.log(`Version ${parsed.archiveVersion} mounted at ${parsed.mountPoint}`);
console.log(`Read ${parsed.index.recordCount} records!`);
```

You can then explore all the records included in the PAK file in `parsed.index.records`. Each object is an `IIndexRecord` and includes all the information included in the index record of the PAK file. 

> Note that (at this time), this does **not** support unpacking the actual file data of the PAK, only reading the records. This _may_ be included in a future update depending on requirements/demand.

