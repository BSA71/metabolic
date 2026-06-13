import { LANDSCAPE_PAGE_INJECT_CSS } from './printStyles';

type PrintDocumentOptions = {
  landscape?: boolean;
};

export function printHtmlDocument(html: string, title = 'Print preview', options?: PrintDocumentOptions) {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', title);
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';

  if (options?.landscape) {
    iframe.style.width = '11in';
    iframe.style.height = '8.5in';
  } else {
    iframe.style.width = '0';
    iframe.style.height = '0';
  }

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

  if (options?.landscape && doc.head) {
    const landscapeStyle = doc.createElement('style');
    landscapeStyle.textContent = LANDSCAPE_PAGE_INJECT_CSS;
    doc.head.appendChild(landscapeStyle);
  }

  const runPrint = () => {
    try {
      frameWindow.focus();
      frameWindow.print();
    } finally {
      window.setTimeout(() => iframe.remove(), 1000);
    }
  };

  window.setTimeout(runPrint, options?.landscape ? 150 : 100);
}
