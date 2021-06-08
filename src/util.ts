import { createHash } from "crypto";

export function getHashDigest(inData: Buffer) {
    var sha1 = createHash('sha1');
    sha1.update(inData);
    return sha1.digest('hex');
}