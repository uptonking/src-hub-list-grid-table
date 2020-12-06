import React, { KeyboardEvent } from 'react';
import classNames from 'classnames';
import { isElement, isValidElementType } from 'react-is';

import { CalculatedColumn, Editor, EditorProps, CommitEvent, Dimension, Omit } from '../types';
import SimpleTextEditor from './SimpleTextEditor';
import ClickOutside from './ClickOutside';
import { InteractionMasksProps, InteractionMasksState } from '../../masks/InteractionMasks';

type SharedInteractionMasksProps<R> = Pick<InteractionMasksProps<R>, 'scrollLeft' | 'scrollTop'>;
type SharedInteractionMasksState = Pick<InteractionMasksState, 'firstEditorKeyPress'>;

type ValueType<R> = R[keyof R];

export interface EditorContainerProps<R>
  extends SharedInteractionMasksProps<R>,
    SharedInteractionMasksState,
    Omit<Dimension, 'zIndex'> {
  rowIdx: number;
  rowData: R;
  value: ValueType<R>;
  column: CalculatedColumn<R>;
  onGridKeyDown?(e: KeyboardEvent): void;
  onCommit(e: CommitEvent<R>): void;
  onCommitCancel(): void;
}

interface EditorContainerState {
  isInvalid: boolean;
}
/**
 * 包含单元格编辑器的容器组件
 */
export default class EditorContainer<R> extends React.Component<EditorContainerProps<R>, EditorContainerState> {
  static displayName = 'EditorContainer';

  changeCommitted = false;
  changeCanceled = false;

  /** ref-editor */
  editor = React.createRef<Editor>();
  /** state */
  state: Readonly<EditorContainerState> = { isInvalid: false };

  componentDidMount() {
    const inputNode = this.getInputNode();
    if (inputNode instanceof HTMLElement) {
      inputNode.focus();
      if (!this.getEditor().disableContainerStyles) {
        inputNode.className += ' editor-main';
        inputNode.style.height = `${this.props.height - 1}px`;
      }
    }
    if (inputNode instanceof HTMLInputElement) {
      inputNode.select();
    }
  }

  componentDidUpdate(prevProps: EditorContainerProps<R>) {
    if (prevProps.scrollLeft !== this.props.scrollLeft || prevProps.scrollTop !== this.props.scrollTop) {
      this.commitCancel();
    }
  }

  componentWillUnmount() {
    if (!this.changeCommitted && !this.changeCanceled) {
      this.commit({ key: 'Enter' });
    }
  }

  onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    switch (e.key) {
      case 'Enter':
        this.onPressEnter();
        break;
      case 'Tab':
        this.onPressTab();
        break;
      case 'Escape':
        this.onPressEscape(e);
        break;
      case 'ArrowUp':
      case 'ArrowDown':
        this.onPressArrowUpOrDown(e);
        break;
      case 'ArrowLeft':
        this.onPressArrowLeft(e);
        break;
      case 'ArrowRight':
        this.onPressArrowRight(e);
        break;
      default:
        break;
    }

    if (this.props.onGridKeyDown) {
      this.props.onGridKeyDown(e);
    }
  };

  /** 创建单元格编辑器的react element */
  createEditor() {
    type P = EditorProps<ValueType<R> | string, unknown, R>;
    const editorProps: P & { ref: React.RefObject<Editor> } = {
      ref: this.editor,
      column: this.props.column,
      value: this.getInitialValue(),
      rowMetaData: this.getRowMetaData(),
      rowData: this.props.rowData,
      height: this.props.height,
      onCommitCancel: this.commitCancel,
      onCommit: this.commit,
      onBlur: this.commit,
      onOverrideKeyDown: this.onKeyDown,
    };

    // 若配置信息中传入了自定义编辑器组件，则使用传入的，否则使用默认的SimpleTextEditor
    const CustomEditor = this.props.column.editor as React.ComponentType<P>;
    // console.log('CustomEditor, ', CustomEditor);

    // return custom column editor or SimpleEditor if none specified
    if (isElement(CustomEditor)) {
      return React.cloneElement(CustomEditor, editorProps);
    }
    if (isValidElementType(CustomEditor)) {
      return <CustomEditor {...editorProps} />;
    }

    // 使用默认的单元格编辑器
    return (
      <SimpleTextEditor
        ref={(this.editor as unknown) as React.RefObject<SimpleTextEditor>}
        column={this.props.column as CalculatedColumn<unknown>}
        value={this.getInitialValue() as string}
        onBlur={this.commit}
      />
    );
  }

  onPressEnter = () => {
    this.commit({ key: 'Enter' });
  };

  onPressTab = () => {
    this.commit({ key: 'Tab' });
  };

  onPressEscape = (e: KeyboardEvent) => {
    if (!this.editorIsSelectOpen()) {
      this.commitCancel();
    } else {
      // prevent event from bubbling if editor has results to select
      e.stopPropagation();
    }
  };

  onPressArrowUpOrDown = (e: KeyboardEvent) => {
    if (this.editorHasResults()) {
      // dont want to propogate as that then moves us round the grid
      e.stopPropagation();
    } else {
      this.commit(e);
    }
  };

  onPressArrowLeft = (e: KeyboardEvent) => {
    // prevent event propogation. this disables left cell navigation
    if (!this.isCaretAtBeginningOfInput()) {
      e.stopPropagation();
    } else {
      this.commit(e);
    }
  };

  onPressArrowRight = (e: KeyboardEvent) => {
    // prevent event propogation. this disables right cell navigation
    if (!this.isCaretAtEndOfInput()) {
      e.stopPropagation();
    } else {
      this.commit(e);
    }
  };

  editorHasResults = () => {
    const { hasResults } = this.getEditor();
    return hasResults ? hasResults() : false;
  };

  editorIsSelectOpen = () => {
    const { isSelectOpen } = this.getEditor();
    return isSelectOpen ? isSelectOpen() : false;
  };

  getRowMetaData() {
    // clone row data so editor cannot actually change this
    // convention based method to get corresponding Id or Name of any Name or Id property
    if (this.props.column.getRowMetaData) {
      return this.props.column.getRowMetaData(this.props.rowData, this.props.column);
    }
  }

  getEditor = () => {
    return this.editor.current!;
  };

  getInputNode = () => {
    return this.getEditor().getInputNode();
  };

  getInitialValue(): ValueType<R> | string {
    const { firstEditorKeyPress: key, value } = this.props;
    if (key === 'Delete' || key === 'Backspace') {
      return '';
    }
    if (key === 'Enter') {
      return value;
    }

    return key || value;
  }

  /** 获取单元格编辑器的值，并更新 */
  commit = (args: { key?: string } = {}) => {
    const { onCommit } = this.props;
    const updated = this.getEditor().getValue();
    // 若是新值
    if (this.isNewValueValid(updated)) {
      this.changeCommitted = true;
      const cellKey = this.props.column.key;
      onCommit({ cellKey, rowIdx: this.props.rowIdx, updated, key: args.key });
    }
  };

  commitCancel = () => {
    this.changeCanceled = true;
    this.props.onCommitCancel();
  };

  isNewValueValid = (value: unknown) => {
    // const { validate } = this.getEditor();
    const editor = this.getEditor();
    if (editor.validate) {
      const isValid = editor.validate(value);
      this.setState({ isInvalid: !isValid });
      return isValid;
    }

    return true;
  };

  isCaretAtBeginningOfInput = () => {
    const inputNode = this.getInputNode();
    return inputNode instanceof HTMLInputElement && inputNode.selectionEnd === 0;
  };

  isCaretAtEndOfInput = () => {
    const inputNode = this.getInputNode();
    return inputNode instanceof HTMLInputElement && inputNode.selectionStart === inputNode.value.length;
  };

  handleRightClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  /** 渲染一个删除图标 */
  renderStatusIcon() {
    return this.state.isInvalid && <span className='glyphicon glyphicon-remove form-control-feedback' />;
  }

  render() {
    console.log('===props4 EditorContainer');

    const { width, height, left, top } = this.props;
    const className = classNames('rdg-editor-container', {
      'has-error': this.state.isInvalid === true,
    });

    return (
      <ClickOutside onClickOutside={this.commit}>
        <div
          className={className}
          style={{ height, width, left, top }}
          onKeyDown={this.onKeyDown}
          onContextMenu={this.handleRightClick}
        >
          {this.createEditor()}
          {this.renderStatusIcon()}
        </div>
      </ClickOutside>
    );
  }
}
