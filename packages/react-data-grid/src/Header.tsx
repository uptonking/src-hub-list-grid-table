import React from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import { GridProps } from './interfaces';
import HeaderRow from './HeaderRow';
import { resizeColumn } from './utils/columnMetrics';
import getScrollbarSize from './utils/getScrollbarSize';
import { HeaderRowType } from './common/enums';
import { CalculatedColumn, ColumnMetrics } from './common/types';

type SharedGridProps<R> = Pick<
  GridProps<R>,
  | 'columnMetrics'
  | 'onColumnResize'
  | 'rowHeight'
  | 'totalWidth'
  | 'headerRows'
  | 'sortColumn'
  | 'sortDirection'
  | 'draggableHeaderCell'
  | 'onSort'
  | 'onHeaderDrop'
  | 'getValidFilterValues'
  | 'cellMetaData'
>;

export type HeaderProps<R> = SharedGridProps<R>;

interface State<R> {
  resizing: { column: CalculatedColumn<R>; columnMetrics: ColumnMetrics<R> } | null;
}
/**
 * 表头组件，渲染HeaderRow组件
 */
export default class Header<R> extends React.Component<HeaderProps<R>, State<R>> {
  /** Header组件的state */
  state: Readonly<State<R>> = { resizing: null };
  /** ref-row */
  row = React.createRef<HeaderRow<R>>();
  /** ref-filterRow */
  filterRow = React.createRef<HeaderRow<R>>();

  UNSAFE_componentWillReceiveProps(): void {
    this.setState({ resizing: null });
  }

  onColumnResize = (column: CalculatedColumn<R>, width: number): void => {
    const pos = this.getColumnPosition(column);

    if (pos === null) return;

    const prevColumnMetrics = this.state.resizing ? this.state.resizing.columnMetrics : this.props.columnMetrics;
    const columnMetrics = resizeColumn({ ...prevColumnMetrics }, pos, width);

    // we don't want to influence scrollLeft while resizing
    if (columnMetrics.totalWidth < prevColumnMetrics.totalWidth) {
      columnMetrics.totalWidth = prevColumnMetrics.totalWidth;
    }

    this.setState({
      resizing: {
        column: columnMetrics.columns[pos],
        columnMetrics,
      },
    });
  };

  onColumnResizeEnd = (column: CalculatedColumn<R>, width: number): void => {
    const pos = this.getColumnPosition(column);
    if (pos === null) return;
    this.props.onColumnResize(pos, width || column.width);
  };

  /** 计算所有表头行 */
  getHeaderRows() {
    const columnMetrics = this.getColumnMetrics();
    let superColumns = [];

    return this.props.headerRows.map((row, index) => {
      // 若是代表过滤器的表头
      const isFilterRow = row.rowType === HeaderRowType.FILTER;
      // 若是多级表头
      const isSuperHeader = row.rowType === HeaderRowType.SUPER;
      // super headers reflect spans of subordinate widths
      if (isSuperHeader) {
        superColumns = row.columns;
        let superColIdx = 0;
        let left = 0;
        let width = 0;
        let i = 1;
        for (const col of columnMetrics.columns) {
          width += col.width;
          if (i === superColumns[superColIdx].span) {
            superColumns[superColIdx].left = left;
            superColumns[superColIdx].width = width;
            left += width;
            width = 0;
            superColIdx++;
            i = 0;
          }
          i++;
        }
      }

      const rowHeight = isFilterRow ? '500px' : 'auto';
      // 计算滚动条的宽度 FIXME 滚动条宽度不会为0
      const scrollbarSize = getScrollbarSize() > 0 ? getScrollbarSize() : 0;
      // console.log('scrollbarSize, ', scrollbarSize);

      // 最后表头的宽度会减去滚动条的宽度
      let updatedWidth: string | number;
      if (typeof this.props.totalWidth === 'number') {
        updatedWidth = this.props.totalWidth - scrollbarSize;
      } else {
        updatedWidth = this.props.totalWidth;
      }

      const headerRowStyle: React.CSSProperties = {
        top: this.getCombinedHeaderHeights(index),
        width: updatedWidth,
        minHeight: rowHeight,
      };

      return (
        <HeaderRow<R>
          ref={isFilterRow ? this.filterRow : this.row}
          key={row.rowType}
          style={headerRowStyle}
          rowType={row.rowType}
          onColumnResize={this.onColumnResize}
          onColumnResizeEnd={this.onColumnResizeEnd}
          width={columnMetrics.width}
          height={row.height || this.props.rowHeight}
          // columns={columnMetrics.columns}
          columns={isSuperHeader ? superColumns : columnMetrics.columns}
          draggableHeaderCell={this.props.draggableHeaderCell}
          filterable={row.filterable}
          onFilterChange={row.onFilterChange}
          onHeaderDrop={this.props.onHeaderDrop}
          sortColumn={this.props.sortColumn}
          sortDirection={this.props.sortDirection}
          onSort={this.props.onSort}
          getValidFilterValues={this.props.getValidFilterValues}
        />
      );
    });
  }

  /** 从this.props或state中获取columnMetrics对象 */
  getColumnMetrics(): ColumnMetrics<R> {
    if (this.state.resizing) {
      return this.state.resizing.columnMetrics;
    }
    return this.props.columnMetrics;
  }

  getColumnPosition(column: CalculatedColumn<R>): number | null {
    const { columns } = this.getColumnMetrics();
    const idx = columns.findIndex(c => c.key === column.key);
    return idx === -1 ? null : idx;
  }

  getCombinedHeaderHeights(until?: number): number {
    const stopAt = typeof until === 'number' ? until : this.props.headerRows.length;

    let height = 0;
    for (let index = 0; index < stopAt; index++) {
      height += this.props.headerRows[index].height || this.props.rowHeight;
    }
    return height;
  }

  setScrollLeft(scrollLeft: number): void {
    const node = ReactDOM.findDOMNode(this.row.current) as Element;
    node.scrollLeft = scrollLeft;
    this.row.current!.setScrollLeft(scrollLeft);
    if (this.filterRow.current) {
      const nodeFilters = ReactDOM.findDOMNode(this.filterRow.current) as Element;
      nodeFilters.scrollLeft = scrollLeft;
      this.filterRow.current.setScrollLeft(scrollLeft);
    }
  }

  // Set the cell selection to -1 x -1 when clicking on the header
  onHeaderClick = (): void => {
    this.props.cellMetaData.onCellClick({ rowIdx: -1, idx: -1 });
  };

  render() {
    console.log('====props4 Header');
    // console.log(this.props);

    const className = classNames('react-grid-Header', {
      'react-grid-Header--resizing': !!this.state.resizing,
    });

    return (
      <div style={{ height: this.getCombinedHeaderHeights() }} className={className} onClick={this.onHeaderClick}>
        {this.getHeaderRows()}
      </div>
    );
  }
}
