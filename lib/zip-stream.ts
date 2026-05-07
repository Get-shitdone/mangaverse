// Minimal ZIP "STORE" (uncompressed) encoder — produces valid CBZ files for
// comic readers (CDisplay, ComicRack, YACReader, Tachiyomi extensions, etc).
// We use STORE (no compression) because manga images are already JPEG/PNG —
// trying to deflate them is wasted CPU and gains nothing.

interface FileEntry {
  filename: string;
  data: Uint8Array;
  crc: number;
  offset: number;
  size: number;
}

function crc32(buf: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function leU16(view: DataView, off: number, v: number) {
  view.setUint16(off, v, true);
}
function leU32(view: DataView, off: number, v: number) {
  view.setUint32(off, v >>> 0, true);
}

// Build a complete ZIP buffer in memory. Suitable for chapter-sized payloads
// (~30-40 page JPGs, typically 10-25 MB total).
export function buildZip(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const enc = new TextEncoder();
  const entries: FileEntry[] = [];
  const localChunks: Uint8Array[] = [];
  let runningOffset = 0;

  for (const f of files) {
    const nameBytes = enc.encode(f.name);
    const crc = crc32(f.data);
    const size = f.data.length;
    const lh = new Uint8Array(30 + nameBytes.length);
    const lhView = new DataView(lh.buffer);
    leU32(lhView, 0, 0x04034b50); // local file header signature
    leU16(lhView, 4, 20); // version needed
    leU16(lhView, 6, 0); // flags
    leU16(lhView, 8, 0); // method = store
    leU16(lhView, 10, 0); // mod time
    leU16(lhView, 12, 0); // mod date
    leU32(lhView, 14, crc);
    leU32(lhView, 18, size);
    leU32(lhView, 22, size);
    leU16(lhView, 26, nameBytes.length);
    leU16(lhView, 28, 0);
    lh.set(nameBytes, 30);

    entries.push({
      filename: f.name,
      data: f.data,
      crc,
      offset: runningOffset,
      size,
    });
    localChunks.push(lh, f.data);
    runningOffset += lh.length + size;
  }

  // Central directory
  const cdChunks: Uint8Array[] = [];
  let cdSize = 0;
  for (const e of entries) {
    const nameBytes = enc.encode(e.filename);
    const ch = new Uint8Array(46 + nameBytes.length);
    const view = new DataView(ch.buffer);
    leU32(view, 0, 0x02014b50); // central dir signature
    leU16(view, 4, 20); // version made by
    leU16(view, 6, 20); // version needed
    leU16(view, 8, 0); // flags
    leU16(view, 10, 0); // method
    leU16(view, 12, 0);
    leU16(view, 14, 0);
    leU32(view, 16, e.crc);
    leU32(view, 20, e.size);
    leU32(view, 24, e.size);
    leU16(view, 28, nameBytes.length);
    leU16(view, 30, 0);
    leU16(view, 32, 0);
    leU16(view, 34, 0);
    leU16(view, 36, 0);
    leU32(view, 38, 0);
    leU32(view, 42, e.offset);
    ch.set(nameBytes, 46);
    cdChunks.push(ch);
    cdSize += ch.length;
  }
  const cdOffset = runningOffset;

  // End of central directory record
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  leU32(eocdView, 0, 0x06054b50);
  leU16(eocdView, 4, 0);
  leU16(eocdView, 6, 0);
  leU16(eocdView, 8, entries.length);
  leU16(eocdView, 10, entries.length);
  leU32(eocdView, 12, cdSize);
  leU32(eocdView, 16, cdOffset);
  leU16(eocdView, 20, 0);

  const total = runningOffset + cdSize + eocd.length;
  const out = new Uint8Array(total);
  let pos = 0;
  for (const c of localChunks) {
    out.set(c, pos);
    pos += c.length;
  }
  for (const c of cdChunks) {
    out.set(c, pos);
    pos += c.length;
  }
  out.set(eocd, pos);
  return out;
}
