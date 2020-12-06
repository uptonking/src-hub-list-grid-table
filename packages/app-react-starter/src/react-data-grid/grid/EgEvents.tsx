import React from 'react';
import { ReactDataGrid } from '../../incubator/react-data-grid/index';

class Example extends React.Component<any, any> {
  _columns: { key: string; name: string }[];
  constructor(props, context) {
    super(props, context);
    this._columns = [
      {
        key: 'id',
        name: 'ID',
      },
      {
        key: 'title',
        name: 'Title',
      },
      {
        key: 'count',
        name: 'Count',
      },
    ];

    // this.state = { rows: this.createRows(1000) };
    this.state = { rows: this.createRows() };
  }

  createRows = () => {
    const rows = [];
    for (let i = 1; i < 1000; i++) {
      rows.push({
        id: i,
        title: `Title ${i}`,
        count: i * 1000,
        isSelected: false,
      });
    }

    return rows;
  };

  rowGetter = i => {
    return this.state.rows[i];
  };

  onRowClick = (rowIdx, row) => {
    const rows = this.state.rows.slice();
    rows[rowIdx] = { ...row, isSelected: !row.isSelected };
    this.setState({ rows });
  };

  onKeyDown = e => {
    if (e.ctrlKey && e.keyCode === 65) {
      e.preventDefault();

      const rows = [];
      this.state.rows.forEach(r => {
        rows.push({ ...r, isSelected: true });
      });

      this.setState({ rows });
    }
  };

  render() {
    return (
      <ReactDataGrid
        rowKey='id'
        columns={this._columns}
        rowGetter={this.rowGetter}
        rowsCount={this.state.rows.length}
        minHeight={500}
        rowSelection={{
          showCheckbox: false,
          selectBy: {
            isSelectedKey: 'isSelected',
          },
        }}
        onRowClick={this.onRowClick}
        onGridKeyDown={this.onKeyDown}
      />
    );
  }
}

export default Example;
