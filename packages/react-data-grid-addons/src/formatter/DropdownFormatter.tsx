import React from 'react';

interface Option {
  title?: string;
  value?: string;
  text?: string;
}

interface Props {
  options: Array<string | Option>;
  value: string;
}

/**
 * (DropDownEditor)单元格处于未编辑状态下的渲染组件。
 * Used for displaying the value of a dropdown (using DropDownEditor) when not editing it.
 * Accepts the same parameters as the DropDownEditor.
 */
export default function DropdownFormatter({ value, options }: Props) {
  // 根据传入的value参数找到options中对应的值
  const option = options.find(v => (typeof v === 'string' ? v === value : v.value === value)) || value;

  if (typeof option === 'string') {
    return <div title={option}>{option}</div>;
  }

  const title = option.title || option.value || value;
  const text = option.text || option.value || value;

  return <div title={title}>{text}</div>;
}
