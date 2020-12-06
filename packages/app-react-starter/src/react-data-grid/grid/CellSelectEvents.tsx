import React from 'react';
import { ReactDataGrid } from '../../incubator/react-data-grid/index';

class Example extends React.Component<any, any> {
  _columns: ({ key: string; name: string; editable?: undefined } | { key: string; name: string; editable: boolean })[];
  _rows: any[];
  grid: any;
  constructor(props) {
    super(props);
    this._columns = [
      { key: 'id', name: 'ID' },
      { key: 'title', name: 'Title', editable: true },
      { key: 'count', name: 'Count' },
    ];

    const rows = [];
    for (let i = 1; i < 1000; i++) {
      rows.push({
        id: i,
        title: `Title ${i}`,
        count: i * 1000,
        active: i % 2,
      });
    }

    this._rows = rows;

    this.state = { selectedRows: [] };
  }

  rowGetter = index => {
    return this._rows[index];
  };

  onRowSelect = rows => {
    this.setState({ selectedRows: rows });
  };

  onCellSelected = ({ rowIdx, idx }) => {
    this.grid.openCellEditor(rowIdx, idx);
  };

  onCellDeSelected = ({ rowIdx, idx }) => {
    this.setState({ alert: `The editor for cell ${idx}, ${rowIdx} should have just closed` });
  };

  render() {
    const rowText = this.state.selectedRows.length === 1 ? 'row' : 'rows';
    return (
      <div>
        <span>
          {this.state.selectedRows.length} {rowText} selected
        </span>
        {this.state.alert && (
          <div className='alert alert-info' role='alert'>
            {this.state.alert}
          </div>
        )}
        <ReactDataGrid
          // eslint-disable-next-line no-return-assign
          ref={node => (this.grid = node)}
          rowKey='id'
          columns={this._columns}
          rowGetter={this.rowGetter}
          rowsCount={this._rows.length}
          enableRowSelect='multi'
          minHeight={500}
          onRowSelect={this.onRowSelect}
          enableCellSelect
          onCellSelected={this.onCellSelected}
          onCellDeSelected={this.onCellDeSelected}
        />
      </div>
    );
  }
}

export default Example;
