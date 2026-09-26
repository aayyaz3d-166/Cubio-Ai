export interface TokenizerInterface {
  readonly vocabSize: number;
  readonly padTokenId: number;
  readonly unkTokenId: number;
  readonly bosTokenId: number;
  readonly eosTokenId: number;
  readonly userTokenId: number;
  readonly assistantTokenId: number;
  readonly systemTokenId: number;
  encode(text: string): number[];
  decode(tokens: number[]): string;
  formatDialogue(turns: { role: 'system' | 'user' | 'assistant'; content: string }[]): string;
}

export class TinyConversationalTokenizer implements TokenizerInterface {
  public readonly tokenToId: Map<string, number> = new Map();
  public readonly idToToken: Map<number, string> = new Map();

  public readonly padToken = '<PAD>';
  public readonly unkToken = '<UNK>';
  public readonly bosToken = '<BOS>';
  public readonly eosToken = '<EOS>';
  public readonly systemToken = '<SYSTEM>';
  public readonly userToken = '<USER>';
  public readonly assistantToken = '<ASSISTANT>';

  public readonly padTokenId: number = 0;
  public readonly unkTokenId: number = 1;
  public readonly bosTokenId: number = 2;
  public readonly eosTokenId: number = 3;
  public readonly systemTokenId: number = 4;
  public readonly userTokenId: number = 5;
  public readonly assistantTokenId: number = 6;

  private nextId: number = 0;

  constructor(maxVocabSize: number = 512) {
    // 1. Register special tokens
    this.addToken(this.padToken);
    this.addToken(this.unkToken);
    this.addToken(this.bosToken);
    this.addToken(this.eosToken);
    this.addToken(this.systemToken);
    this.addToken(this.userToken);
    this.addToken(this.assistantToken);

    // 2. Add standard ASCII characters (digits, lower, upper, punctuation, whitespace)
    const asciiChars = ' \n\t.,!?:;\'"-()[]{}+-*/=<>0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (const char of asciiChars) {
      if (!this.tokenToId.has(char)) {
        this.addToken(char);
      }
    }

    // 3. Pre-populate conversational subwords/tokens up to maxVocabSize
    const commonWords = [
      'hello', 'hi', 'how', 'are', 'you', 'i', 'am', 'good', 'fine', 'thank', 'thanks',
      'what', 'is', 'your', 'name', 'my', 'cubio', 'tiny', 'assistant', 'model',
      'can', 'help', 'with', 'code', 'yes', 'no', 'sure', 'today', 'do', 'think',
      'about', 'the', 'a', 'an', 'to', 'for', 'in', 'on', 'at', 'by', 'of', 'and',
      'or', 'not', 'we', 'they', 'it', 'this', 'that', 'there', 'here', 'please'
    ];
    for (const word of commonWords) {
      if (this.nextId < maxVocabSize && !this.tokenToId.has(word)) {
        this.addToken(word);
      }
    }

    // Pad vocabulary to maxVocabSize if needed with reserved tokens
    while (this.nextId < maxVocabSize) {
      this.addToken(`<RESERVED_${this.nextId}>`);
    }
  }

  private addToken(token: string): number {
    const id = this.nextId++;
    this.tokenToId.set(token, id);
    this.idToToken.set(id, token);
    return id;
  }

  public get vocabSize(): number {
    return this.tokenToId.size;
  }

  public formatDialogue(turns: { role: 'system' | 'user' | 'assistant'; content: string }[]): string {
    let formatted = `${this.bosToken}`;
    for (const turn of turns) {
      if (turn.role === 'system') {
        formatted += `${this.systemToken}${turn.content}`;
      } else if (turn.role === 'user') {
        formatted += `${this.userToken}${turn.content}`;
      } else if (turn.role === 'assistant') {
        formatted += `${this.assistantToken}${turn.content}${this.eosToken}`;
      }
    }
    return formatted;
  }

  public encode(text: string): number[] {
    const tokens: number[] = [];
    let i = 0;
    const specialTokens = [
      this.padToken, this.unkToken, this.bosToken, this.eosToken,
      this.systemToken, this.userToken, this.assistantToken
    ];

    while (i < text.length) {
      // Check special tokens
      let matchedSpecial = false;
      for (const st of specialTokens) {
        if (text.startsWith(st, i)) {
          tokens.push(this.tokenToId.get(st)!);
          i += st.length;
          matchedSpecial = true;
          break;
        }
      }
      if (matchedSpecial) continue;

      // Check single character
      const char = text[i];
      if (this.tokenToId.has(char)) {
        tokens.push(this.tokenToId.get(char)!);
      } else {
        tokens.push(this.unkTokenId);
      }
      i++;
    }
    return tokens;
  }

  public decode(tokens: number[]): string {
    let result = '';
    for (const id of tokens) {
      const tok = this.idToToken.get(id);
      if (tok !== undefined) {
        result += tok;
      } else {
        result += this.unkToken;
      }
    }
    return result;
  }
}
