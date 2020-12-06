import React from 'react';
import { isValidElementType } from 'react-is';
import { GridProps, ScrollState } from './interfaces';
import Header from './Header';
import Viewport from './Viewport';
import { isFrozen } from './utils/columnUtils';

/**
 * Grid组件依赖Viewport组件显示列表数据，是无状态组件，主要逻辑放在Viewport。
 * 每次update会重新设置_scrollLeft
 */
export default class Grid<R> extends React.Component<GridProps<R>> {
  static displayName = 'Grid';

  /** ref-header */
  readonly header = React.createRef<Header<R>>();
  /** ref-viewport */
  readonly viewport = React.createRef<Viewport<R>>();
  /** scrollLeft长度 */
  _scrollLeft?: number = undefined;

  componentDidMount() {
    // console.log('====componentDidMount Grid');

    this._scrollLeft = this.viewport.current ? this.viewport.current.getScroll().scrollLeft : 0;
    // console.log('_scrollLeft, ', this._scrollLeft);
    this._onScroll();
  }

  componentDidUpdate() {
    console.log('====componentDidUpdate Grid');

    this._onScroll();
  }

  /** 通过ref设置header和viewport的_scrollLeft属性 */
  _onScroll() {
    if (this._scrollLeft !== undefined) {
      this.header.current.setScrollLeft(this._scrollLeft);
      if (this.viewport.current) {
        this.viewport.current.setScrollLeft(this._scrollLeft);
      }
    }
  }

  /** 滚动事件处理函数会作为props传到Viewport */
  onScroll = (scrollState: ScrollState) => {
    if (this.props.onScroll) {
      this.props.onScroll(scrollState);
    }
    const { scrollLeft } = scrollState;
    if (this._scrollLeft !== scrollLeft || this.areFrozenColumnsScrolledLeft(scrollLeft)) {
      this._scrollLeft = scrollLeft;
      this._onScroll();
    }
  };

  areFrozenColumnsScrolledLeft(scrollLeft: number) {
    return scrollLeft > 0 && this.props.columnMetrics.columns.some(c => isFrozen(c));
  }

  getGridDataView() {
    const EmptyRowsView = this.props.emptyRowsView;
    const showEmptyRowsView = this.props.rowsCount === 0 && isValidElementType(EmptyRowsView);
    let gridDataView: JSX.Element;
    // console.log('showEmptyRowsView, ', showEmptyRowsView);
    if (showEmptyRowsView) {
      gridDataView = (
        <div className='react-grid-Empty'>
          <EmptyRowsView />
        </div>
      );
    } else {
      gridDataView = (
        <div onKeyDown={this.props.onViewportKeydown} onKeyUp={this.props.onViewportKeyup}>
          <Viewport<R>
            ref={this.viewport}
            columnMetrics={this.props.columnMetrics}
            totalWidth={this.props.totalWidth}
            minHeight={this.props.minHeight}
            rowKey={this.props.rowKey}
            rowHeight={this.props.rowHeight}
            rowRenderer={this.props.rowRenderer}
            rowGetter={this.props.rowGetter}
            rowsCount={this.props.rowsCount}
            rowOffsetHeight={this.props.rowOffsetHeight || this.props.rowHeight * this.props.headerRows.length}
            rowGroupRenderer={this.props.rowGroupRenderer}
            rowSelection={this.props.rowSelection}
            RowsContainer={this.props.RowsContainer}
            selectedRows={this.props.selectedRows}
            getSubRowDetails={this.props.getSubRowDetails}
            cellMetaData={this.props.cellMetaData}
            enableCellSelect={this.props.enableCellSelect}
            enableCellAutoFocus={this.props.enableCellAutoFocus}
            cellNavigationMode={this.props.cellNavigationMode}
            contextMenu={this.props.contextMenu}
            eventBus={this.props.eventBus}
            interactionMasksMetaData={this.props.interactionMasksMetaData}
            onScroll={this.onScroll}
            scrollToRowIndex={this.props.scrollToRowIndex}
            editorPortalTarget={this.props.editorPortalTarget}
          />
        </div>
      );
    }

    return gridDataView;
  }

  render() {
    console.log('====props4 Grid');
    // console.log(this.props);
    // console.log(this.state);

    return (
      <div className='react-grid-Grid' style={{ minHeight: this.props.minHeight }}>
        <Header<R>
          ref={this.header}
          columnMetrics={this.props.columnMetrics}
          onColumnResize={this.props.onColumnResize}
          onSort={this.props.onSort}
          sortColumn={this.props.sortColumn}
          sortDirection={this.props.sortDirection}
          totalWidth={this.props.totalWidth}
          rowHeight={this.props.rowHeight}
          cellMetaData={this.props.cellMetaData}
          headerRows={this.props.headerRows}
          onHeaderDrop={this.props.onHeaderDrop}
          draggableHeaderCell={this.props.draggableHeaderCell}
          getValidFilterValues={this.props.getValidFilterValues}
        />
        {this.getGridDataView()}
      </div>
    );
  }
}
