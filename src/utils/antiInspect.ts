export function installAntiInspectProtection(): () => void {
  const onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    return false;
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    const ctrlOrCmd = e.ctrlKey || e.metaKey;

    if (e.key === 'F12') {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Block DevTools & View Source combos: Ctrl+Shift+I/J/C, Cmd+Opt+I/J/C, Ctrl+U
    if (ctrlOrCmd && e.shiftKey && (key === 'i' || key === 'j' || key === 'c')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    if (e.metaKey && e.altKey && (key === 'i' || key === 'j' || key === 'c' || key === 'u')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    if (ctrlOrCmd && (key === 'u' || key === 's')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  };

  const onDragStart = (e: DragEvent) => {
    e.preventDefault();
  };

  document.addEventListener('contextmenu', onContextMenu);
  window.addEventListener('keydown', onKeyDown, true);
  document.addEventListener('dragstart', onDragStart);

  return () => {
    document.removeEventListener('contextmenu', onContextMenu);
    window.removeEventListener('keydown', onKeyDown, true);
    document.removeEventListener('dragstart', onDragStart);
  };
}

export async function toggleFullscreen(): Promise<boolean> {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      return true;
    } else {
      await document.exitFullscreen();
      return false;
    }
  } catch {
    return Boolean(document.fullscreenElement);
  }
}
