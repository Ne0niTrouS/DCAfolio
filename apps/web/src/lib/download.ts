/**
 * Hands a generated file to the browser.
 *
 * The object URL is revoked immediately after the click: the blob would
 * otherwise stay in memory for the life of the document.
 */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
