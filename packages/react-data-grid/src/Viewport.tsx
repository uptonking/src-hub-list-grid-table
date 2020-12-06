import React from 'react';
import { GridProps, ScrollState } from './interfaces';
import Canvas from './Canvas';
import {
  getGridState,
  getColOverscanEndIdx,
  getVisibleBoundaries,
  getScrollDirection,
  getRowOverscanStartIdx,
  getRowOverscanEndIdx,
  getColOverscanStartIdx,
  getNonFrozenVisibleColStartIdx,
  getNonFrozenRenderedColumnCount,
  findLastFrozenColumnIndex,
} from './utils/viewportUtils';
import { ScrollPosition } from './common/types';
import { SCROLL_DIRECTION } from './common/enums';

type SharedGridProps<R> = Pick<
  GridProps<R>,
  | 'rowKey'
  | 'rowHeight'
  | 'rowRenderer'
  | 'rowGetter'
  | 'rowsCount'
  | 'selectedRows'
  | 'columnMetrics'
  | 'totalWidth'
  | 'cellMetaData'
  | 'rowOffsetHeight'
  | 'minHeight'
  | 'scrollToRowIndex'
  | 'contextMenu'
  | 'rowSelection'
  | 'getSubRowDetails'
  | 'rowGroupRenderer'
  | 'enableCellSelect'
  | 'enableCellAutoFocus'
  | 'cellNavigationMode'
  | 'eventBus'
  | 'interactionMasksMetaData'
  | 'RowsContainer'
  | 'editorPortalTarget'
>;

export interface ViewportProps<R> extends SharedGridProps<R> {
  onScroll(scrollState: ScrollState): void;
}
/** 滚动相关高度、行数信息 */
interface ScrollParams {
  /** canvasHeight */
  height: number;
  scrollTop: number;
  scrollLeft: number;
  rowsCount: number;
  rowHeight: number;
}

/** Viewport组件的state类型 */
export interface ViewportState {
  /** 除表头行外的表格主体的高度，即canvasHeight */
  height: number;
  rowOverscanStartIdx: number;
  rowOverscanEndIdx: number;
  rowVisibleStartIdx: number;
  rowVisibleEndIdx: number;
  scrollTop: number;
  scrollLeft: number;
  colVisibleStartIdx: number;
  colVisibleEndIdx: number;
  colOverscanStartIdx: number;
  colOverscanEndIdx: number;
  isScrolling: boolean;
  lastFrozenColumnIndex: number;
}

/**
 * 容器型组件，处理滚动事件，计算要渲染到Canvas组件的行数和列数
 */
export default class Viewport<R> extends React.Component<ViewportProps<R>, ViewportState> {
  static displayName = 'Viewport';

  /** Viewport组件的初始state，初始值根据this.props计算得到 */
  state: Readonly<ViewportState> = getGridState(this.props);
  /** ref-canvas */
  canvas = React.createRef<Canvas<R>>();
  /** ref-viewport */
  viewport = React.createRef<HTMLDivElement>();
  /** resetScrollStateTimeoutId */
  resetScrollStateTimeoutId: number | null = null;

  componentDidMount() {
    window.addEventListener('resize', this.metricsUpdated);
    this.metricsUpdated();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.metricsUpdated);
    this.clearScrollTimer();
  }

  UNSAFE_componentWillReceiveProps(nextProps: ViewportProps<R>) {
    console.log('====componentWillReceiveProps Viewport');

    const { rowHeight, rowsCount } = nextProps;
    // 若行高变化，或表格总高度变化
    if (this.props.rowHeight !== nextProps.rowHeight || this.props.minHeight !== nextProps.minHeight) {
      // 重新计算行列范围
      const { scrollTop, scrollLeft, height } = getGridState(nextProps);
      // 通过setState更新state
      this.updateScroll({
        scrollTop,
        scrollLeft,
        height,
        rowHeight,
        rowsCount,
      });
    } else if (this.props.columnMetrics.columns.length !== nextProps.columnMetrics.columns.length) {
      this.setState(getGridState(nextProps));
    } else if (this.props.rowsCount !== nextProps.rowsCount) {
      const { scrollTop, scrollLeft, height } = this.state;
      this.updateScroll({
        scrollTop,
        scrollLeft,
        height,
        rowHeight,
        rowsCount,
      });
      // Added to fix the hiding of the bottom scrollbar when showing the filters.
    } else if (this.props.rowOffsetHeight !== nextProps.rowOffsetHeight) {
      const { scrollTop, scrollLeft } = this.state;
      // The value of height can be positive or negative and will be added to the current height to cater for changes in the header height (due to the filer)
      const height = this.state.height + this.props.rowOffsetHeight - nextProps.rowOffsetHeight;
      this.updateScroll({
        scrollTop,
        scrollLeft,
        height,
        rowHeight,
        rowsCount,
      });
    }
  }

  onScroll = ({ scrollTop, scrollLeft }: ScrollPosition) => {
    const { rowHeight, rowsCount, onScroll } = this.props;
    const nextScrollState = this.updateScroll({
      scrollTop,
      scrollLeft,
      height: this.state.height,
      rowHeight,
      rowsCount,
    });

    onScroll(nextScrollState);
  };

  getScroll() {
    return this.canvas.current.getScroll();
  }

  setScrollLeft(scrollLeft: number) {
    this.canvas.current.setScrollLeft(scrollLeft);
  }

  getDOMNodeOffsetWidth() {
    return this.viewport.current ? this.viewport.current.offsetWidth : 0;
  }

  clearScrollTimer() {
    if (this.resetScrollStateTimeoutId !== null) {
      window.clearTimeout(this.resetScrollStateTimeoutId);
    }
  }

  /** 计算行列可见范围及预加载范围 */
  getNextScrollState({ scrollTop, scrollLeft, height, rowHeight, rowsCount }: ScrollParams): ScrollState {
    const isScrolling = true;
    const { columns } = this.props.columnMetrics;
    // 先获取滚动方向
    const scrollDirection: SCROLL_DIRECTION = getScrollDirection(this.state, scrollTop, scrollLeft);
    // 计算可见范围内的起止行号
    const { rowVisibleStartIdx, rowVisibleEndIdx } = getVisibleBoundaries(height, rowHeight, scrollTop, rowsCount);
    // 起始行之前的预加载行，可以防闪烁
    const rowOverscanStartIdx = getRowOverscanStartIdx(scrollDirection, rowVisibleStartIdx);
    // 末尾行之后的预加载行
    const rowOverscanEndIdx = getRowOverscanEndIdx(scrollDirection, rowVisibleEndIdx, rowsCount);
    const totalNumberColumns = columns.length;

    // 处理固定列的情况
    const lastFrozenColumnIndex = findLastFrozenColumnIndex(columns);
    const nonFrozenColVisibleStartIdx = getNonFrozenVisibleColStartIdx(columns, scrollLeft);
    const nonFrozenRenderedColumnCount = getNonFrozenRenderedColumnCount(
      this.props.columnMetrics,
      this.getDOMNodeOffsetWidth(),
      scrollLeft,
    );
    const colVisibleEndIdx = Math.min(nonFrozenColVisibleStartIdx + nonFrozenRenderedColumnCount, totalNumberColumns);
    const colOverscanStartIdx = getColOverscanStartIdx(
      scrollDirection,
      nonFrozenColVisibleStartIdx,
      lastFrozenColumnIndex,
    );
    const colOverscanEndIdx = getColOverscanEndIdx(scrollDirection, colVisibleEndIdx, totalNumberColumns);

    return {
      height,
      scrollTop,
      scrollLeft,
      rowVisibleStartIdx,
      rowVisibleEndIdx,
      rowOverscanStartIdx,
      rowOverscanEndIdx,
      colVisibleStartIdx: nonFrozenColVisibleStartIdx,
      colVisibleEndIdx,
      colOverscanStartIdx,
      colOverscanEndIdx,
      lastFrozenColumnIndex,
      isScrolling,
      scrollDirection,
    };
  }

  resetScrollStateAfterDelay() {
    this.clearScrollTimer();
    this.resetScrollStateTimeoutId = window.setTimeout(this.resetScrollStateAfterDelayCallback, 500);
  }

  resetScrollStateAfterDelayCallback = () => {
    this.resetScrollStateTimeoutId = null;
    this.setState({ isScrolling: false });
  };

  /** 根据滚动情况，更新行列可见范围及预加载范围 */
  updateScroll(scrollParams: ScrollParams) {
    this.resetScrollStateAfterDelay();
    const nextScrollState = this.getNextScrollState(scrollParams);
    this.setState(nextScrollState);
    return nextScrollState;
  }

  /** 重新计算要渲染的行列索引，window-resize会触发 */
  metricsUpdated = () => {
    if (!this.viewport.current) {
      return;
    }
    // 获取当前元素相对于视口的位置集合中的height
    const { height } = this.viewport.current.getBoundingClientRect();
    console.log('vp-height, ', height);

    if (height) {
      const { scrollTop, scrollLeft } = this.state;
      const { rowHeight, rowsCount } = this.props;
      this.updateScroll({
        scrollTop,
        scrollLeft,
        height,
        rowHeight,
        rowsCount,
      });
    }
  };

  render() {
    console.log('====props4 Viewport');
    // console.log(this.props);
    console.log(this.state);

    return (
      <div className='rdg-viewport' style={{ top: this.props.rowOffsetHeight }} ref={this.viewport}>
        <Canvas<R>
          ref={this.canvas}
          columns={this.props.columnMetrics.columns}
          colVisibleStartIdx={this.state.colVisibleStartIdx}
          colVisibleEndIdx={this.state.colVisibleEndIdx}
          colOverscanStartIdx={this.state.colOverscanStartIdx}
          colOverscanEndIdx={this.state.colOverscanEndIdx}
          lastFrozenColumnIndex={this.state.lastFrozenColumnIndex}
          totalColumnWidth={this.props.columnMetrics.totalColumnWidth}
          totalWidth={this.props.totalWidth}
          width={this.props.columnMetrics.width}
          height={this.state.height}
          rowHeight={this.props.rowHeight}
          rowKey={this.props.rowKey}
          rowGetter={this.props.rowGetter}
          rowsCount={this.props.rowsCount}
          rowRenderer={this.props.rowRenderer}
          rowOverscanStartIdx={this.state.rowOverscanStartIdx}
          rowOverscanEndIdx={this.state.rowOverscanEndIdx}
          rowVisibleStartIdx={this.state.rowVisibleStartIdx}
          rowVisibleEndIdx={this.state.rowVisibleEndIdx}
          rowSelection={this.props.rowSelection}
          rowGroupRenderer={this.props.rowGroupRenderer}
          RowsContainer={this.props.RowsContainer}
          getSubRowDetails={this.props.getSubRowDetails}
          selectedRows={this.props.selectedRows}
          cellMetaData={this.props.cellMetaData}
          enableCellSelect={this.props.enableCellSelect}
          enableCellAutoFocus={this.props.enableCellAutoFocus}
          cellNavigationMode={this.props.cellNavigationMode}
          onScroll={this.onScroll}
          scrollToRowIndex={this.props.scrollToRowIndex}
          isScrolling={this.state.isScrolling}
          contextMenu={this.props.contextMenu}
          eventBus={this.props.eventBus}
          interactionMasksMetaData={this.props.interactionMasksMetaData}
          editorPortalTarget={this.props.editorPortalTarget}
        />
      </div>
    );
  }
}
