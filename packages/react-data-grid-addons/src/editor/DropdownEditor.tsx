import React from 'react';

/**
 * 单元格下拉菜单编辑器组件
 */
export default class DropdownEditor extends React.Component<any, {}> {
  /** ref-select */
  select: any;
  //   static propTypes = {
  //     options: PropTypes.arrayOf(
  //       PropTypes.oneOfType([
  //         PropTypes.string,
  //         PropTypes.shape({
  //           id: PropTypes.string,
  //           title: PropTypes.string,
  //           value: PropTypes.string,
  //           text: PropTypes.string,
  //         }),
  //       ]),
  //     ).isRequired,
  //   };
  //   static propTypes = {
  //     value: PropTypes.any.isRequired,
  //     onBlur: PropTypes.func.isRequired,
  //     // column: PropTypes.shape(Column).isRequired
  //   };

  getInputNode() {
    return this.select;
  }

  getValue() {
    return {
      [this.props.column.key]: this.select.value,
    };
  }

  setSelectRef = select => {
    this.select = select;
  };

  renderOptions() {
    return this.props.options.map(name => {
      if (typeof name === 'string') {
        return (
          <option key={name} value={name}>
            {name}
          </option>
        );
      }

      return (
        <option key={name.id} value={name.value} title={name.title}>
          {name.text || name.value}
        </option>
      );
    });
  }

  render() {
    return (
      <select
        ref={this.setSelectRef}
        style={{ width: '100%' }}
        defaultValue={this.props.value}
        onBlur={this.props.onBlur}
      >
        {this.renderOptions()}
      </select>
    );
  }
}
