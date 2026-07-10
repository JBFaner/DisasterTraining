export function blurAllFocus() {
    if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
    }

    document.querySelectorAll('[contenteditable="true"]').forEach((element) => {
        if (element instanceof HTMLElement) {
            element.blur();
        }
    });
}
