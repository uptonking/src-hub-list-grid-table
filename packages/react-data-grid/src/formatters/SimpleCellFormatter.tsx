import React from 'react';

export interface SimpleCellFormatterProps {
  value: string | number | boolean;
}

/**
 * CellValue组件默认使用的格式化工具，不添加额外样式，直接渲染值
 */
export function SimpleCellFormatter({ value }: SimpleCellFormatterProps) {
  return <div title={String(value)}>{value}</div>;
}
