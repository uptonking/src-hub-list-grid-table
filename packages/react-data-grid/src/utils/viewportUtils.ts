import { isFrozen } from './columnUtils';
import { SCROLL_DIRECTION } from '../common/enums';
import { CalculatedColumn, ColumnMetrics } from '../common/types';

/** 默认会在滚动方向上预加载2行 */
export const OVERSCAN_ROWS = 2;

const { min, max, ceil, round } = Math;

/** 根据this.props计算Viewport组件state的值，首次渲染及更新都会调用 */
export function getGridState<R>(props: {
  columnMetrics: ColumnMetrics<R>;
  rowsCount: number;
  minHeight: number;
  rowHeight: number;
  rowOffsetHeight: number;
}) {
  // 获取总列数
  const totalNumberColumns = props.columnMetrics.columns.length;
  // 表格开始需要滚动的高度 - 表头行高度
  const canvasHeight = props.minHeight - props.rowOffsetHeight;
  // 计算要渲染的行数
  const renderedRowsCount = ceil((props.minHeight - props.rowHeight) / props.rowHeight);
  // 预加载的末尾行索引初始值是渲染行数的2倍  FIXME 可优化预加载行数的初始值，不必设置为2倍
  const rowOverscanEndIdx = min(props.rowsCount, renderedRowsCount * 2);

  return {
    rowOverscanStartIdx: 0,
    rowOverscanEndIdx,
    rowVisibleStartIdx: 0,
    rowVisibleEndIdx: renderedRowsCount,
    height: canvasHeight,
    scrollTop: 0,
    scrollLeft: 0,
    colVisibleStartIdx: 0,
    colVisibleEndIdx: totalNumberColumns,
    colOverscanStartIdx: 0,
    colOverscanEndIdx: totalNumberColumns,
    isScrolling: false,
    lastFrozenColumnIndex: 0,
  };
}

export function findLastFrozenColumnIndex<R>(columns: CalculatedColumn<R>[]): number {
  return columns.findIndex(c => isFrozen(c));
}

function getTotalFrozenColumnWidth<R>(columns: CalculatedColumn<R>[]): number {
  const lastFrozenColumnIndex = findLastFrozenColumnIndex(columns);
  if (lastFrozenColumnIndex === -1) {
    return 0;
  }
  const lastFrozenColumn = columns[lastFrozenColumnIndex];
  return lastFrozenColumn.left + lastFrozenColumn.width;
}

function getColumnCountForWidth<R>(
  columns: CalculatedColumn<R>[],
  initialWidth: number,
  colVisibleStartIdx: number,
): number {
  let width = initialWidth;
  let count = 0;

  columns.forEach((column, idx) => {
    if (idx! >= colVisibleStartIdx) {
      width -= column.width;
      if (width >= 0) {
        count++;
      }
    }
  });

  return count;
}

export function getNonFrozenVisibleColStartIdx<R>(columns: CalculatedColumn<R>[], scrollLeft: number): number {
  let remainingScroll = scrollLeft;
  const lastFrozenColumnIndex = findLastFrozenColumnIndex(columns);
  const nonFrozenColumns = columns.slice(lastFrozenColumnIndex + 1);
  let columnIndex = lastFrozenColumnIndex;
  while (remainingScroll >= 0 && columnIndex < nonFrozenColumns.length) {
    columnIndex++;
    const column = columns[columnIndex];
    remainingScroll -= column ? column.width : 0;
  }
  return max(columnIndex, 0);
}

export function getNonFrozenRenderedColumnCount<R>(
  columnMetrics: ColumnMetrics<R>,
  viewportDomWidth: number,
  scrollLeft: number,
): number {
  const { columns, totalColumnWidth } = columnMetrics;
  if (columns.length === 0) {
    return 0;
  }
  const colVisibleStartIdx = getNonFrozenVisibleColStartIdx(columns, scrollLeft);
  const totalFrozenColumnWidth = getTotalFrozenColumnWidth(columns);
  const viewportWidth = viewportDomWidth > 0 ? viewportDomWidth : totalColumnWidth;
  const firstColumn = columns[colVisibleStartIdx];
  // calculate the portion width of first column hidden behind frozen columns
  const scrolledFrozenWidth = totalFrozenColumnWidth + scrollLeft;
  const firstColumnHiddenWidth = scrolledFrozenWidth > firstColumn.left ? scrolledFrozenWidth - firstColumn.left : 0;
  const initialWidth = viewportWidth - totalFrozenColumnWidth + firstColumnHiddenWidth;
  return getColumnCountForWidth(columns, initialWidth, colVisibleStartIdx);
}

/** 可见范围内行的起止索引号 */
export interface VisibleBoundaries {
  rowVisibleStartIdx: number;
  rowVisibleEndIdx: number;
}

/**
 * 计算当前可见范围内行的起止索引号
 * @param gridHeight  应该是canvasHeight，除表头外表格主体高度
 * @param rowHeight 行高
 * @param scrollTop 竖直滚动已隐藏的高度
 * @param rowsCount 总行数
 */
export function getVisibleBoundaries(
  gridHeight: number,
  rowHeight: number,
  scrollTop: number,
  rowsCount: number,
): VisibleBoundaries {
  // 可见范围可包含的总行数
  const renderedRowsCount = ceil(gridHeight / rowHeight);
  // 可见范围的起始行索引，最小为0
  const rowVisibleStartIdx = max(0, round(scrollTop / rowHeight));
  // 可见范围的末尾行索引，最大为总行数
  const rowVisibleEndIdx = min(rowVisibleStartIdx + renderedRowsCount, rowsCount);
  return { rowVisibleStartIdx, rowVisibleEndIdx };
}

interface ScrollState {
  scrollTop?: number;
  scrollLeft?: number;
}

/** 计算当前滚动的方向，默认none */
export function getScrollDirection(lastScroll: ScrollState, scrollTop: number, scrollLeft: number): SCROLL_DIRECTION {
  if (scrollTop !== lastScroll.scrollTop && lastScroll.scrollTop !== undefined) {
    return scrollTop - lastScroll.scrollTop >= 0 ? SCROLL_DIRECTION.DOWN : SCROLL_DIRECTION.UP;
  }
  if (scrollLeft !== lastScroll.scrollLeft && lastScroll.scrollLeft !== undefined) {
    return scrollLeft - lastScroll.scrollLeft >= 0 ? SCROLL_DIRECTION.RIGHT : SCROLL_DIRECTION.LEFT;
  }
  return SCROLL_DIRECTION.NONE;
}

/**
 * 计算可见起始行之前的预加载行，可防止闪烁
 * @param scrollDirection   滚动方向
 * @param rowVisibleStartIdx  可见范围内起始行索引
 */
export function getRowOverscanStartIdx(scrollDirection: SCROLL_DIRECTION, rowVisibleStartIdx: number): number {
  return scrollDirection === SCROLL_DIRECTION.UP
    ? max(0, rowVisibleStartIdx - OVERSCAN_ROWS)
    : max(0, rowVisibleStartIdx);
}

/**
 * 计算可见末尾行之后的预加载行
 * @param scrollDirection 滚动方向
 * @param rowVisibleEndIdx 可见范围内末尾行索引
 * @param rowsCount 总行数
 */
export function getRowOverscanEndIdx(
  scrollDirection: SCROLL_DIRECTION,
  rowVisibleEndIdx: number,
  rowsCount: number,
): number {
  if (scrollDirection === SCROLL_DIRECTION.DOWN) {
    const overscanBoundaryIdx = rowVisibleEndIdx + OVERSCAN_ROWS;
    return min(overscanBoundaryIdx, rowsCount);
  }
  return rowVisibleEndIdx;
}

export function getColOverscanStartIdx(
  scrollDirection: SCROLL_DIRECTION,
  colVisibleStartIdx: number,
  lastFrozenColumnIdx: number,
): number {
  if (scrollDirection === SCROLL_DIRECTION.LEFT || scrollDirection === SCROLL_DIRECTION.RIGHT) {
    return lastFrozenColumnIdx > -1 ? lastFrozenColumnIdx + 1 : 0;
  }
  return colVisibleStartIdx;
}

export function getColOverscanEndIdx(
  scrollDirection: SCROLL_DIRECTION,
  colVisibleEndIdx: number,
  totalNumberColumns: number,
): number {
  if (scrollDirection === SCROLL_DIRECTION.DOWN || scrollDirection === SCROLL_DIRECTION.UP) {
    return colVisibleEndIdx;
  }
  return totalNumberColumns;
}
