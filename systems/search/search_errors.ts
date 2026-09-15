export class SearchError extends Error {
  public code: string;
  public details?: any;

  constructor(message: string, code: string = 'SEARCH_ERROR', details?: any) {
    super(message);
    this.name = 'SearchError';
    this.code = code;
    this.details = details;
  }
}

export class InvalidQueryError extends SearchError {
  constructor(message: string, details?: any) {
    super(message, 'INVALID_SEARCH_QUERY', details);
    this.name = 'InvalidQueryError';
  }
}

export class SearchTimeoutError extends SearchError {
  constructor(message: string = 'Search execution exceeded maximum allowed time', details?: any) {
    super(message, 'SEARCH_TIMEOUT', details);
    this.name = 'SearchTimeoutError';
  }
}

export class IndexNotReadyError extends SearchError {
  constructor(message: string = 'Inverted search index has not been populated or is rebuilding', details?: any) {
    super(message, 'INDEX_NOT_READY', details);
    this.name = 'IndexNotReadyError';
  }
}
