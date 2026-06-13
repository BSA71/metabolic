/** Explicit landscape page rules for weekly plans. */
export const LANDSCAPE_PAGE_CSS = `
@page landscape-sheet {
  size: letter landscape;
  margin: 0.35in;
}
@page landscape-sheet {
  size: 11in 8.5in;
  margin: 0.35in;
}
html.landscape-print {
  page: landscape-sheet;
}
@media print {
  html.landscape-print body {
    padding: 0.35in;
  }
}
`;

export const LANDSCAPE_PAGE_INJECT_CSS = `
@page landscape-sheet { size: letter landscape; margin: 0.35in; }
@page landscape-sheet { size: 11in 8.5in; margin: 0.35in; }
html.landscape-print { page: landscape-sheet; }
`;
