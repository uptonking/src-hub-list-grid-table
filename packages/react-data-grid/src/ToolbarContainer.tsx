import React from 'react';
import { isElement, isValidElementType } from 'react-is';
import { ColumnList } from './common/types';
import { ReactDataGridProps } from './ReactDataGrid';

/** ToolbarContainer组件的props类型 */
export interface ToolbarProps<R> {
  /** 列信息和宽度配置 */
  columns: ColumnList<R>;
  /** 总行数 */
  rowsCount: number;
  /** 切换过滤器的事件处理函数 */
  onToggleFilter(): void;
}

type ToolbarContainerProps<R> = ToolbarProps<R> & Pick<ReactDataGridProps<R>, 'toolbar'>;

/**
 * 表格顶部之外的工具栏组件，包括切换过滤器行的开关。
 * 若toolbar属性不存在，则return null。
 */
export default function ToolbarContainer<R>({ toolbar, columns, rowsCount, onToggleFilter }: ToolbarContainerProps<R>) {
  // console.log('====props4 ToolbarContainer');
  // eslint-disable-next-line prefer-rest-params
  // console.log(arguments[0]);

  // 若传入的toolbar为undefined或null，则不渲染
  if (!toolbar) {
    return null;
  }

  const toolBarProps = { columns, onToggleFilter, rowsCount };

  if (isElement(toolbar)) {
    return React.cloneElement(toolbar, toolBarProps);
  }

  if (isValidElementType(toolbar)) {
    return React.createElement(toolbar, toolBarProps);
  }

  return null;
}
