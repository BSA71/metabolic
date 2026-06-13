import type { ShoppingListResult } from '../types';
import { formatPlannedMealContext } from './shoppingListFormat';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

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
          const planned = formatPlannedMealContext(item);
          const location = result.storeName && item.storeLocation
            ? `<span class="location">${escapeHtml(item.storeLocation)}</span>`
            : '';
          const notes = item.notes ? `<p class="notes">${escapeHtml(item.notes)}</p>` : '';

          return `
            <li class="item">
              <span class="checkbox" aria-hidden="true"></span>
              <div class="item-body">
                <div class="item-row">
                  <p class="item-title">${escapeHtml(item.groceryDescription)}</p>
                  ${location}
                </div>
                <p class="item-meta">${escapeHtml(planned)}</p>
                ${notes}
              </div>
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
        padding: 32px;
        font-size: 12px;
        line-height: 1.45;
      }
      header {
        border-bottom: 2px solid #1f2933;
        margin-bottom: 24px;
        padding-bottom: 16px;
      }
      h1 {
        margin: 0 0 6px;
        font-size: 24px;
        letter-spacing: -0.02em;
      }
      .subtitle, .intro, .footnote {
        margin: 0;
        color: #4b5563;
      }
      .intro {
        margin-top: 16px;
        font-size: 13px;
      }
      .section {
        break-inside: avoid;
        margin-bottom: 20px;
      }
      .section h2 {
        margin: 0 0 8px;
        font-size: 11px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #6b7280;
      }
      ul {
        list-style: none;
        margin: 0;
        padding: 0;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        overflow: hidden;
      }
      .item {
        display: flex;
        gap: 12px;
        padding: 12px 14px;
        border-top: 1px solid #e5e7eb;
      }
      .item:first-child { border-top: none; }
      .checkbox {
        width: 14px;
        height: 14px;
        margin-top: 2px;
        border: 1.5px solid #374151;
        border-radius: 3px;
        flex-shrink: 0;
      }
      .item-body { min-width: 0; flex: 1; }
      .item-row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: flex-start;
      }
      .item-title {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
      }
      .location {
        flex-shrink: 0;
        border-radius: 999px;
        background: #f3f4f6;
        padding: 2px 8px;
        font-size: 10px;
        font-weight: 600;
        color: #374151;
      }
      .item-meta, .notes {
        margin: 4px 0 0;
        color: #6b7280;
        font-size: 11px;
      }
      .footnote {
        margin-top: 24px;
        font-size: 10px;
      }
      @media print {
        body { padding: 0.5in; }
        @page { margin: 0.5in; }
      }
    </style>
  </head>
  <body>
    <header>
      <h1>${escapeHtml(title)}</h1>
      <p class="subtitle">${escapeHtml(formatRangeLabel(result))} · ${result.itemCount} item${result.itemCount === 1 ? '' : 's'}</p>
      ${result.intro ? `<p class="intro">${escapeHtml(result.intro)}</p>` : ''}
    </header>
    ${sectionsHtml}
    <p class="footnote">${escapeHtml(result.note)}</p>
  </body>
</html>`;
}

export function printShoppingList(result: ShoppingListResult) {
  if (!result.itemCount) return;

  const html = buildShoppingListHtml(result);
  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', 'Shopping list print preview');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  document.body.appendChild(iframe);

  const frameWindow = iframe.contentWindow;
  const doc = iframe.contentDocument ?? frameWindow?.document;
  if (!doc || !frameWindow) {
    iframe.remove();
    throw new Error('Could not prepare print view.');
  }

  doc.open();
  doc.write(html);
  doc.close();

  const runPrint = () => {
    try {
      frameWindow.focus();
      frameWindow.print();
    } finally {
      window.setTimeout(() => iframe.remove(), 1000);
    }
  };

  window.setTimeout(runPrint, 100);
}
