import React from 'react';
import { Editor, EditorProps } from '../types';

type Props = Pick<EditorProps<string>, 'value' | 'column' | 'onBlur'>;

/**
 * 默认使用的单元格编辑器组件。
 * TODO 转换成受控组件
 */
export default class SimpleTextEditor extends React.Component<Props> implements Editor<{ [key: string]: string }> {
  /** ref-cell-editor-input */
  input = React.createRef<HTMLInputElement>();

  getInputNode() {
    return this.input.current;
  }

  getValue() {
    return {
      [this.props.column.key]: this.input.current.value,
    };
  }

  render() {
    console.log('====props4 SimpleTextEditor');
    return (
      <input className='form-control' ref={this.input} defaultValue={this.props.value} onBlur={this.props.onBlur} />
    );
  }
}
