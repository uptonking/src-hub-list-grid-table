export { sameColumn } from './ColumnComparer';
import { getColumnsArrLength, isFrozen } from './columnUtils';
import getScrollbarSize from './getScrollbarSize';
import { Column, CalculatedColumn, ColumnList, ColumnMetrics } from '../common/types';

type Metrics<R> = Pick<ColumnMetrics<R>, 'totalWidth' | 'minColumnWidth'> & {
  columns: ColumnList<R>;
};

/**
 * 重新计算grid的宽度，给输入参数metrics添加了width和totalColumnWidth属性
 * @param metrics 包含columns,minColumnWidth,totalWidth属性的对象
 */
export function recalculate<R>(metrics: Metrics<R>): ColumnMetrics<R> {
  // clone columns so we can safely edit them:
  const columnsCopy = cloneColumns(metrics.columns);
  // compute width for columns which specify width
  setColumnWidths(columnsCopy, metrics.totalWidth);

  // 计算各列宽度和
  const width = getTotalColumnWidth(columnsCopy);
  // 计算空白宽度
  const unallocatedWidth = metrics.totalWidth - width - getScrollbarSize();

  // compute width for columns which doesn't specify width
  setDefferedColumnWidths(columnsCopy, unallocatedWidth, metrics.minColumnWidth);

  // compute left offset
  setColumnOffsets(columnsCopy);

  const frozenColumns = columnsCopy.filter(c => isFrozen(c));
  const nonFrozenColumns = columnsCopy.filter(c => !isFrozen(c));
  const calculatedColumns = frozenColumns.concat(nonFrozenColumns) as CalculatedColumn<R>[];
  // 给每列添加索引
  calculatedColumns.forEach((c, i) => {
    c.idx = i;
  });
  return {
    width,
    columns: calculatedColumns,
    totalWidth: metrics.totalWidth,
    minColumnWidth: metrics.minColumnWidth,
    totalColumnWidth: getTotalColumnWidth(columnsCopy),
  };
}

/**
 * 通过遍历复制数组columns
 * @param columns 各列信息
 */
function cloneColumns<R>(columns: ColumnList<R>): Column<R>[] {
  if (Array.isArray(columns)) {
    return columns.map(c => ({ ...c }));
  }
  // return cloneColumns(columns.toArray());
  return null;
}

/** 遍历各列，若使用的是百分比设置宽度，则根据%计算各列的宽度值 */
function setColumnWidths<R>(columns: Column<R>[], totalWidth: number): void {
  for (const column of columns) {
    if (typeof column.width === 'string' && /^\d+%$/.test(column.width)) {
      column.width = Math.floor((totalWidth * column.width) / 100);
    }
  }
}

/** 计算预留的宽度 */
function setDefferedColumnWidths<R>(columns: Column<R>[], unallocatedWidth: number, minColumnWidth: number): void {
  const defferedColumns = columns.filter(c => !c.width);
  const columnWidth = Math.floor(unallocatedWidth / defferedColumns.length);

  for (const column of columns) {
    if (column.width) continue;

    if (unallocatedWidth <= 0) {
      column.width = minColumnWidth;
    }

    column.width = columnWidth < minColumnWidth ? minColumnWidth : columnWidth;
  }
}

/** 遍历各列，计算各列到最左边各自的偏移量 */
function setColumnOffsets<R>(columns: Column<R>[]): void {
  let left = 0;
  for (const column of columns as CalculatedColumn<R>[]) {
    column.left = left;
    left += column.width;
  }
}

function getTotalColumnWidth<R>(columns: Column<R>[]): number {
  return columns.reduce((acc, c) => acc + (c.width || 0), 0);
}

/**
 * Update column metrics calculation by resizing a column.
 */
export function resizeColumn<R>(metrics: ColumnMetrics<R>, index: number, width: number): ColumnMetrics<R> {
  const updatedColumn = { ...metrics.columns[index] };
  updatedColumn.width = Math.max(width, metrics.minColumnWidth);
  const updatedMetrics = { ...metrics };
  updatedMetrics.columns = [...metrics.columns];
  updatedMetrics.columns.splice(index, 1, updatedColumn);

  return recalculate(updatedMetrics);
}

type ColumnComparer<R> = (colA: Column<R>, colB: Column<R>) => boolean;

function compareEachColumn<R>(
  prevColumns: ColumnList<R>,
  nextColumns: ColumnList<R>,
  isSameColumn: ColumnComparer<R>,
): boolean {
  if (getColumnsArrLength(prevColumns) !== getColumnsArrLength(nextColumns)) return false;

  const keys = new Set<keyof R>();
  const prevColumnsMap = new Map<keyof R, Column<R>>();
  const nextColumnsMap = new Map<keyof R, Column<R>>();

  for (const column of prevColumns) {
    keys.add(column.key);
    prevColumnsMap.set(column.key, column);
  }

  for (const column of nextColumns) {
    keys.add(column.key);
    nextColumnsMap.set(column.key, column);
  }

  if (keys.size > prevColumnsMap.size) return false;

  for (const key of keys) {
    if (!prevColumnsMap.has(key) || !nextColumnsMap.has(key)) return false;
    const prevColumn = prevColumnsMap.get(key) as Column<R>;
    const nextColumn = nextColumnsMap.get(key) as Column<R>;
    if (!isSameColumn(prevColumn, nextColumn)) return false;
  }

  return true;
}

export function sameColumns<R>(
  prevColumns: ColumnList<R>,
  nextColumns: ColumnList<R>,
  isSameColumn: ColumnComparer<R>,
): boolean {
  return compareEachColumn(prevColumns, nextColumns, isSameColumn);
}
