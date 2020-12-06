import React from 'react';
import './index.css';

interface ToolbarProps {
  children?: React.ReactNode;
  onAddRow?(arg: { newRowIndex: number }): void;
  onToggleFilter?(): void;
  enableFilter?: boolean;
  numberOfRows?: number;
  addRowButtonText?: string;
  filterRowsButtonText?: string;
}
/**
 * 表格上方外部的工具栏组件，可打开过滤列、添加行的功能
 */
export default function Toolbar(props: ToolbarProps) {
  function onAddRow() {
    props.onAddRow!({ newRowIndex: props.numberOfRows });
  }

  return (
    <div className='react-grid-Toolbar'>
      <div className='tools'>
        {props.onAddRow && (
          <button type='button' className='btn' onClick={onAddRow}>
            {props.addRowButtonText || 'Add Row'}
          </button>
        )}
        {props.enableFilter && (
          <button type='button' className='btn' onClick={props.onToggleFilter}>
            {props.filterRowsButtonText || 'Filter Rows'}
          </button>
        )}
        {props.children}
      </div>
    </div>
  );
}
