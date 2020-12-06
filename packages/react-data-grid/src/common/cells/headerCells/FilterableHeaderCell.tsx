import React, { useState } from 'react';
import { FilterRendererProps } from '../../types';

/** 支持过滤的表头单元格的默认组件，可以匹配包含input字符串中的列 */
export default function FilterableHeaderCell<R>({ column, onChange }: FilterRendererProps<R>) {
  // 在state中定义filterTerm
  const [filterTerm, setFilterTerm] = useState('');

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { value } = event.target;
    setFilterTerm(value);
    // 调用传过来的onChange方法，可以添加或删除过滤词条
    if (onChange) {
      onChange({ filterTerm: value, column });
    }
  }

  if (column.filterable === false) {
    return <div />;
  }

  return (
    <div className='form-group'>
      <input
        key={`header-filter-${column.key as keyof R}`}
        className='form-control input-sm'
        placeholder='Search'
        value={filterTerm}
        onChange={handleChange}
      />
    </div>
  );
}
