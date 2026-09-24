/**
 * CubiO — Step 87 Token Array Codec
 */

export class TokenCodec {
  public static pack(tokens: readonly number[]): Uint32Array {
    return new Uint32Array(tokens);
  }

  public static unpack(packed: Uint32Array): readonly number[] {
    return Object.freeze(Array.from(packed));
  }
}
