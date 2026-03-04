import { useCallback, useEffect, useRef } from 'react';

interface Cell {
  rowIndex: number;
  columnIndex: number;
}

interface UseKeyboardNavigationOptions {
  rowCount: number;
  columnCount: number;
  onCellFocus?: (cell: Cell) => void;
  onCellEdit?: (cell: Cell) => void;
  isEditing?: boolean;
}

export function useKeyboardNavigation({
  rowCount,
  columnCount,
  onCellFocus,
  onCellEdit,
  isEditing = false,
}: UseKeyboardNavigationOptions) {
  const currentCellRef = useRef<Cell>({ rowIndex: 0, columnIndex: 0 });

  const moveTo = useCallback(
    (rowIndex: number, columnIndex: number) => {
      // Clamp to valid range
      const newRow = Math.max(0, Math.min(rowIndex, rowCount - 1));
      const newCol = Math.max(0, Math.min(columnIndex, columnCount - 1));

      currentCellRef.current = { rowIndex: newRow, columnIndex: newCol };
      onCellFocus?.({ rowIndex: newRow, columnIndex: newCol });
    },
    [rowCount, columnCount, onCellFocus]
  );

  const moveUp = useCallback(() => {
    const { rowIndex, columnIndex } = currentCellRef.current;
    moveTo(rowIndex - 1, columnIndex);
  }, [moveTo]);

  const moveDown = useCallback(() => {
    const { rowIndex, columnIndex } = currentCellRef.current;
    moveTo(rowIndex + 1, columnIndex);
  }, [moveTo]);

  const moveLeft = useCallback(() => {
    const { rowIndex, columnIndex } = currentCellRef.current;
    moveTo(rowIndex, columnIndex - 1);
  }, [moveTo]);

  const moveRight = useCallback(() => {
    const { rowIndex, columnIndex } = currentCellRef.current;
    moveTo(rowIndex, columnIndex + 1);
  }, [moveTo]);

  const editCurrentCell = useCallback(() => {
    onCellEdit?.(currentCellRef.current);
  }, [onCellEdit]);

  useEffect(() => {
    if (isEditing) return; // Don't handle navigation while editing

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if we're in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          moveUp();
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveDown();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          moveLeft();
          break;
        case 'ArrowRight':
          e.preventDefault();
          moveRight();
          break;
        case 'Enter':
          e.preventDefault();
          editCurrentCell();
          break;
        case 'Tab':
          e.preventDefault();
          if (e.shiftKey) {
            moveLeft();
          } else {
            moveRight();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, moveUp, moveDown, moveLeft, moveRight, editCurrentCell]);

  return {
    currentCell: currentCellRef.current,
    moveTo,
    moveUp,
    moveDown,
    moveLeft,
    moveRight,
    editCurrentCell,
  };
}
