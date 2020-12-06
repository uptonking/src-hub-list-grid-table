import React from 'react';
import { ReactDataGrid } from '../../incubator/react-data-grid/index';

class Example extends React.Component<any, any> {
  _columns: { key: string; name: string }[];
  constructor(props) {
    super(props);
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

    const rows = [];
    for (let i = 1; i < 1000; i++) {
      rows.push({
        id: i,
        title: `Title ${i}`,
        count: i * 1000,
      });
    }
    this.state = { rows, selectedIndexes: [] };
  }

  rowGetter = i => {
    return this.state.rows[i];
  };

  onRowsSelected = rows => {
    this.setState({ selectedIndexes: this.state.selectedIndexes.concat(rows.map(r => r.rowIdx)) });
  };

  onRowsDeselected = rows => {
    const rowIndexes = rows.map(r => r.rowIdx);
    this.setState({ selectedIndexes: this.state.selectedIndexes.filter(i => rowIndexes.indexOf(i) === -1) });
  };

  render() {
    const rowText = this.state.selectedIndexes.length === 1 ? 'row' : 'rows';
    return (
      <div>
        <span>
          {this.state.selectedIndexes.length} {rowText} selected
        </span>
        <ReactDataGrid
          rowKey='id'
          columns={this._columns}
          rowGetter={this.rowGetter}
          rowsCount={this.state.rows.length}
          minHeight={500}
          rowSelection={{
            showCheckbox: true,
            enableShiftSelect: true,
            onRowsSelected: this.onRowsSelected,
            onRowsDeselected: this.onRowsDeselected,
            selectBy: {
              indexes: this.state.selectedIndexes,
            },
          }}
        />
      </div>
    );
  }
}

export default Example;
