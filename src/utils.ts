// Helper to get caret coordinates within a textarea.
// We use a dummy div to simulate the textarea's styling to calculate the exact position.
export function getCaretCoordinates(textarea: HTMLTextAreaElement, selectionStart: number) {
  const div = document.createElement("div");
  const computed = window.getComputedStyle(textarea);
  
  for (const prop of computed) {
    div.style.setProperty(prop, computed.getPropertyValue(prop));
  }
  
  div.style.position = "absolute";
  div.style.visibility = "hidden";
  div.style.whiteSpace = "pre-wrap";
  div.style.wordWrap = "break-word";
  
  const textBefore = textarea.value.substring(0, selectionStart);
  div.textContent = textBefore;
  
  const span = document.createElement("span");
  span.textContent = textarea.value.substring(selectionStart) || ".";
  div.appendChild(span);
  
  document.body.appendChild(div);
  
  const rect = span.getBoundingClientRect();
  const top = rect.top - div.getBoundingClientRect().top + textarea.getBoundingClientRect().top - textarea.scrollTop;
  const left = rect.left - div.getBoundingClientRect().left + textarea.getBoundingClientRect().left - textarea.scrollLeft;
  
  document.body.removeChild(div);
  
  return { top, left };
}

export function classNames(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}
