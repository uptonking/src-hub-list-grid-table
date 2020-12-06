import React from 'react';
import { ReactDataGrid } from '../../incubator/react-data-grid/index';

class Example extends React.Component<any, any> {
  _columns: (
    | { key: string; name: string; width: number; editable?: undefined }
    | { key: string; name: string; editable: boolean; width?: undefined }
  )[];
  constructor(props, context) {
    super(props, context);
    this._columns = [
      {
        key: 'id',
        name: 'ID',
        width: 80,
      },
      {
        key: 'task',
        name: 'Title',
        editable: true,
      },
      {
        key: 'priority',
        name: 'Priority',
        editable: true,
      },
      {
        key: 'issueType',
        name: 'Issue Type',
        editable: true,
      },
    ];

    this.state = { rows: this.createRows(1000) };
  }

  createRows = numberOfRows => {
    const rows = [];
    for (let i = 1; i < numberOfRows; i++) {
      rows.push({
        id: i,
        task: `Task ${i}`,
        complete: Math.min(100, Math.round(Math.random() * 110)),
        priority: ['Critical', 'High', 'Medium', 'Low'][Math.floor(Math.random() * 3 + 1)],
        issueType: ['Bug', 'Improvement', 'Epic', 'Story'][Math.floor(Math.random() * 3 + 1)],
      });
    }
    return rows;
  };

  rowGetter = i => {
    return this.state.rows[i];
  };

  handleGridRowsUpdated = ({ fromRow, toRow, updated }) => {
    const rows = this.state.rows.slice();

    for (let i = fromRow; i <= toRow; i++) {
      const rowToUpdate = rows[i];
      // const updatedRow = update(rowToUpdate, { $merge: updated });
      const updatedRow = { ...rowToUpdate, ...updated };

      rows[i] = updatedRow;
    }

    this.setState({ rows });
  };

  render() {
    return (
      <ReactDataGrid
        enableCellSelect
        columns={this._columns}
        rowGetter={this.rowGetter}
        rowsCount={this.state.rows.length}
        minHeight={500}
        onGridRowsUpdated={this.handleGridRowsUpdated}
      />
    );
  }
}

export default Example;
