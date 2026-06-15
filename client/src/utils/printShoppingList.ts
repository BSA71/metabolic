import type { ShoppingListResult } from '../types';
import { escapeHtml } from './exportFormat';
import { printHtmlDocument } from './printDocument';

function formatRangeLabel(result: ShoppingListResult) {
  if (result.startDate === result.endDate) return result.startDate;
  return `${result.startDate} to ${result.endDate}`;
}

function buildShoppingListHtml(result: ShoppingListResult) {
  const title = result.storeName ? `Shopping list · ${result.storeName}` : 'Shopping list';
  const sectionsHtml = result.sections
    .map((section) => {
      const itemsHtml = section.items
        .map((item) => {
          const location =
            result.storeName && item.storeLocation
              ? `<span class="location">${escapeHtml(item.storeLocation)}</span>`
              : '';

          return `
            <li class="item">
              <span class="checkbox" aria-hidden="true"></span>
              <span class="item-title">${escapeHtml(item.groceryDescription)}</span>
              ${location}
            </li>
          `;
        })
        .join('');

      return `
        <section class="section">
          <h2>${escapeHtml(section.title)}</h2>
          <ul>${itemsHtml}</ul>
        </section>
      `;
    })
    .join('');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root {
        color: #111827;
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 0.3in;
        font-size: 9px;
        line-height: 1.25;
      }
      header {
        border-bottom: 1px solid #1f2933;
        margin-bottom: 10px;
        padding-bottom: 6px;
      }
      h1 {
        margin: 0;
        font-size: 14px;
        letter-spacing: -0.01em;
      }
      .subtitle {
        margin: 2px 0 0;
        color: #4b5563;
        font-size: 9px;
      }
      .sections {
        column-count: 2;
        column-gap: 18px;
      }
      .section {
        break-inside: avoid;
        margin-bottom: 10px;
      }
      .section h2 {
        margin: 0 0 3px;
        font-size: 8px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #6b7280;
      }
      ul {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .item {
        display: grid;
        grid-template-columns: 10px minmax(0, 1fr) auto;
        gap: 5px;
        align-items: start;
        padding: 1px 0;
        break-inside: avoid;
      }
      .checkbox {
        width: 9px;
        height: 9px;
        margin-top: 1px;
        border: 1px solid #374151;
        border-radius: 1px;
      }
      .item-title {
        margin: 0;
        font-size: 9px;
        font-weight: 500;
      }
      .location {
        flex-shrink: 0;
        font-size: 7px;
        color: #6b7280;
        white-space: nowrap;
      }
      .footnote {
        margin: 8px 0 0;
        color: #9ca3af;
        font-size: 7px;
        line-height: 1.3;
      }
      @media print {
        body { padding: 0.25in; }
        @page { margin: 0.35in; size: portrait; }
      }
    </style>
  </head>
  <body>
    <header>
      <h1>${escapeHtml(title)}</h1>
      <p class="subtitle">${escapeHtml(formatRangeLabel(result))} · ${result.itemCount} item${result.itemCount === 1 ? '' : 's'}</p>
    </header>
    <div class="sections">${sectionsHtml}</div>
    <p class="footnote">${escapeHtml(result.note)}</p>
  </body>
</html>`;
}

export function printShoppingList(result: ShoppingListResult) {
  if (!result.itemCount) return;
  printHtmlDocument(buildShoppingListHtml(result), 'Shopping list print preview');
}
