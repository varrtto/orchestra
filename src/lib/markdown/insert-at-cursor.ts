export function insertAtCursor(
  textarea: HTMLTextAreaElement,
  before: string,
  after = "",
  placeholder = "",
): string {
  const { selectionStart, selectionEnd, value } = textarea;
  const selected = value.slice(selectionStart, selectionEnd) || placeholder;
  const next =
    value.slice(0, selectionStart) +
    before +
    selected +
    after +
    value.slice(selectionEnd);

  const cursorStart = selectionStart + before.length;
  const cursorEnd = cursorStart + selected.length;

  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(cursorStart, cursorEnd);
  });

  return next;
}
