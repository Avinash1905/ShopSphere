export type ExportFormat = 'CSV' | 'JSON' | 'MARKDOWN_TABLE';

export class ReportExporter {
  public static exportDataset<T extends Record<string, any>>(
    data: T[],
    columns: (keyof T | string)[],
    format: ExportFormat = 'CSV'
  ): string {
    if (format === 'JSON') {
      return JSON.stringify(data, null, 2);
    }

    if (format === 'MARKDOWN_TABLE') {
      return this.toMarkdownTable(data, columns);
    }

    // Default CSV
    return this.toCSV(data, columns);
  }

  private static toCSV<T extends Record<string, any>>(data: T[], columns: (keyof T | string)[]): string {
    const headers = columns.join(',');
    const rows = data.map((item) => {
      return columns
        .map((col) => {
          const val = item[col as keyof T];
          if (val === null || val === undefined) return '';
          if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return String(val);
        })
        .join(',');
    });

    return [headers, ...rows].join('\n');
  }

  private static toMarkdownTable<T extends Record<string, any>>(data: T[], columns: (keyof T | string)[]): string {
    if (data.length === 0) return '_No records available_';

    const headerRow = `| ${columns.join(' | ')} |`;
    const separatorRow = `| ${columns.map(() => '---').join(' | ')} |`;
    const rows = data.map((item) => {
      const cells = columns.map((col) => {
        const val = item[col as keyof T];
        return val !== null && val !== undefined ? String(val) : '';
      });
      return `| ${cells.join(' | ')} |`;
    });

    return [headerRow, separatorRow, ...rows].join('\n');
  }
}
