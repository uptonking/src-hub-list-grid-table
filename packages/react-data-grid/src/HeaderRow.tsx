import React from 'react';
import shallowEqual from 'shallowequal';

import HeaderCell from './HeaderCell';
import SortableHeaderCell from './common/cells/headerCells/SortableHeaderCell';
import FilterableHeaderCell from './common/cells/headerCells/FilterableHeaderCell';
import getScrollbarSize from './utils/getScrollbarSize';
import { isFrozen } from './utils/columnUtils';
import { HeaderRowType, HeaderCellType, DEFINE_SORT } from './common/enums';
import { CalculatedColumn, AddFilterEvent } from './common/types';
import { HeaderProps } from './Header';

type SharedHeaderProps<R> = Pick<
  HeaderProps<R>,
  'draggableHeaderCell' | 'onHeaderDrop' | 'sortColumn' | 'sortDirection' | 'onSort' | 'getValidFilterValues'
>;

export interface HeaderRowProps<R> extends SharedHeaderProps<R> {
  width?: number;
  height: number;
  columns: CalculatedColumn<R>[];
  onColumnResize(column: CalculatedColumn<R>, width: number): void;
  onColumnResizeEnd(column: CalculatedColumn<R>, width: number): void;
  style?: React.CSSProperties;
  filterable?: boolean;
  onFilterChange?(args: AddFilterEvent<R>): void;
  rowType: HeaderRowType;
}

/**
 * 表头的一行
 */
export default class HeaderRow<R> extends React.Component<HeaderRowProps<R>> {
  static displayName = 'HeaderRow';

  /** 存放一个表头行所有单元格组件的字典 */
  cells = new Map<keyof R, HeaderCell<R>>();

  shouldComponentUpdate(nextProps: HeaderRowProps<R>) {
    return (
      nextProps.width !== this.props.width ||
      nextProps.height !== this.props.height ||
      nextProps.columns !== this.props.columns ||
      !shallowEqual(nextProps.style, this.props.style) ||
      this.props.sortColumn !== nextProps.sortColumn ||
      this.props.sortDirection !== nextProps.sortDirection
    );
  }

  /** 获取表头行单元格的类型，包括3种，FILTERABLE,SORTABLE,NONE */
  getHeaderCellType(column: CalculatedColumn<R>): HeaderCellType {
    if (column.filterable && this.props.filterable) {
      return HeaderCellType.FILTERABLE;
    }

    if (column.sortable && this.props.rowType !== HeaderRowType.FILTER) {
      return HeaderCellType.SORTABLE;
    }

    if (this.props.rowType === HeaderRowType.SUPER) {
      return HeaderCellType.SUPER;
    }

    return HeaderCellType.NONE;
  }

  /** 渲染支持过滤的表头单元格 */
  getFilterableHeaderCell(column: CalculatedColumn<R>) {
    // 选择自定义过滤器组件或默认值
    const FilterRenderer = column.filterRenderer || FilterableHeaderCell;
    return (
      <FilterRenderer<R>
        column={column}
        onChange={this.props.onFilterChange}
        getValidFilterValues={this.props.getValidFilterValues}
      />
    );
  }

  getSortableHeaderCell(column: CalculatedColumn<R>) {
    const sortDirection = (this.props.sortColumn === column.key && this.props.sortDirection) || DEFINE_SORT.NONE;
    const sortDescendingFirst = column.sortDescendingFirst || false;
    return (
      <SortableHeaderCell<R>
        column={column}
        rowType={this.props.rowType}
        onSort={this.props.onSort}
        sortDirection={sortDirection}
        sortDescendingFirst={sortDescendingFirst}
      />
    );
  }

  /** 创建分组表头的元素 */
  getSuperHeaderCell = column => {
    const classSuffix = column.name ? '' : '-empty';
    return <div className={`rdg-super-header-cell${classSuffix}`}>{column.name}</div>;
  };

  /** 根据表头单元格类型获取相应的表头单元格组件 */
  getHeaderRenderer(column: CalculatedColumn<R>) {
    if (column.headerRenderer && !column.sortable && !this.props.filterable) {
      return column.headerRenderer;
    }
    const headerCellType = this.getHeaderCellType(column);
    switch (headerCellType) {
      case HeaderCellType.SORTABLE:
        return this.getSortableHeaderCell(column);
      case HeaderCellType.FILTERABLE:
        return this.getFilterableHeaderCell(column);
      case HeaderCellType.SUPER:
        return this.getSuperHeaderCell(column);
      default:
        return undefined;
    }
  }

  setScrollLeft(scrollLeft: number): void {
    this.props.columns.forEach(column => {
      const { key } = column;
      if (!this.cells.has(key)) return;
      const cell = this.cells.get(key)!;
      if (isFrozen(column)) {
        cell.setScrollLeft(scrollLeft);
      } else {
        cell.removeScroll();
      }
    });
  }

  /** 返回一个表头行所有单元格组件的数组 */
  getCells() {
    const cells = [];
    const frozenCells = [];
    const { columns, rowType } = this.props;

    for (const column of columns) {
      const { key } = column;
      const isFilterable = key === 'select-row' && rowType === HeaderRowType.FILTER;
      // 根据单元格类型选择要渲染的单元格组件
      const renderer = isFilterable ? <div /> : this.getHeaderRenderer(column);

      const cell = (
        <HeaderCell<R>
          key={key as string}
          ref={node => (node ? this.cells.set(key, node) : this.cells.delete(key))}
          column={column}
          rowType={rowType}
          height={this.props.height}
          renderer={renderer}
          onResize={this.props.onColumnResize}
          onResizeEnd={this.props.onColumnResizeEnd}
          onHeaderDrop={this.props.onHeaderDrop}
          draggableHeaderCell={this.props.draggableHeaderCell}
        />
      );

      if (isFrozen(column)) {
        frozenCells.push(cell);
      } else {
        cells.push(cell);
      }
    }

    return cells.concat(frozenCells);
  }

  render() {
    console.log('====props4 HeaderRow');
    // console.log(this.props);

    const cellsStyle: React.CSSProperties = {
      width: this.props.width ? this.props.width + getScrollbarSize() : '100%',
      height: this.props.height,
    };

    // FIXME: do we need 2 wrapping divs?
    return (
      <div style={this.props.style} className='react-grid-HeaderRow'>
        <div style={cellsStyle}>{this.getCells()}</div>
      </div>
    );
  }
}
