import { SearchTokenizer } from './tokenizer.js';

export interface Posting {
  docId: string;
  field: string;
  frequency: number;
  positions: number[];
}

export interface IndexedDocument {
  id: string;
  fields: Record<string, string>;
  fieldLengths: Record<string, number>;
  attributes: Record<string, any>;
}

export class InvertedIndex {
  // term -> map(docId -> Posting)
  private index: Map<string, Map<string, Posting>> = new Map();
  private documents: Map<string, IndexedDocument> = new Map();
  private totalFieldLengths: Record<string, number> = {};

  public addDocument(id: string, fields: Record<string, string>, attributes: Record<string, any> = {}): void {
    const fieldLengths: Record<string, number> = {};

    for (const [fieldName, text] of Object.entries(fields)) {
      if (!text) continue;
      const tokens = SearchTokenizer.tokenize(text);
      fieldLengths[fieldName] = tokens.length;
      this.totalFieldLengths[fieldName] = (this.totalFieldLengths[fieldName] || 0) + tokens.length;

      for (const token of tokens) {
        // Index exact term and stemmed term
        this.indexToken(token.term, id, fieldName, token.position);
        if (token.stemmed !== token.term) {
          this.indexToken(token.stemmed, id, fieldName, token.position);
        }
      }
    }

    this.documents.set(id, { id, fields, fieldLengths, attributes });
  }

  public removeDocument(id: string): void {
    const doc = this.documents.get(id);
    if (!doc) return;

    for (const [term, postingMap] of this.index.entries()) {
      postingMap.delete(id);
      if (postingMap.size === 0) {
        this.index.delete(term);
      }
    }

    this.documents.delete(id);
  }

  public getPostings(term: string): Map<string, Posting> | undefined {
    return this.index.get(term.toLowerCase());
  }

  public getDocument(id: string): IndexedDocument | undefined {
    return this.documents.get(id);
  }

  public getAllDocuments(): IndexedDocument[] {
    return Array.from(this.documents.values());
  }

  public getTotalDocuments(): number {
    return this.documents.size;
  }

  public getAverageFieldLength(fieldName: string): number {
    if (this.documents.size === 0) return 0;
    return (this.totalFieldLengths[fieldName] || 0) / this.documents.size;
  }

  public exactPhraseMatch(phrase: string, fieldName?: string): string[] {
    const tokens = SearchTokenizer.tokenize(phrase);
    if (tokens.length === 0) return [];

    const firstTermPostings = this.getPostings(tokens[0].term);
    if (!firstTermPostings) return [];

    const candidateDocIds = Array.from(firstTermPostings.keys());
    const matchedDocIds: string[] = [];

    for (const docId of candidateDocIds) {
      const p1 = firstTermPostings.get(docId);
      if (!p1 || (fieldName && p1.field !== fieldName)) continue;

      let hasMatch = false;
      for (const startPos of p1.positions) {
        let allFollow = true;
        for (let i = 1; i < tokens.length; i++) {
          const nextPostings = this.getPostings(tokens[i].term);
          const nextP = nextPostings?.get(docId);
          if (!nextP || !nextP.positions.includes(startPos + i)) {
            allFollow = false;
            break;
          }
        }
        if (allFollow) {
          hasMatch = true;
          break;
        }
      }

      if (hasMatch) {
        matchedDocIds.push(docId);
      }
    }

    return matchedDocIds;
  }

  private indexToken(term: string, docId: string, field: string, position: number): void {
    const termKey = term.toLowerCase();
    let postingMap = this.index.get(termKey);
    if (!postingMap) {
      postingMap = new Map();
      this.index.set(termKey, postingMap);
    }

    let posting = postingMap.get(docId);
    if (!posting) {
      posting = { docId, field, frequency: 0, positions: [] };
      postingMap.set(docId, posting);
    }

    posting.frequency++;
    posting.positions.push(position);
  }
}
