import React from 'react';
import { ReactDataGrid } from '../../incubator/react-data-grid/index';

const columns = [
  { key: 'id', name: 'ID', editable: true },
  { key: 'title', name: 'Title', editable: true },
  { key: 'complete', name: 'Complete', editable: false },
];

const rows = [
  { id: 0, title: 'Task 1', complete: 10 },
  { id: 1, title: 'Task 2', complete: 20 },
  { id: 2, title: 'Task 3', complete: 30 },
  { id: 3, title: 'Task 4', complete: 40 },
  { id: 4, title: 'Task 5', complete: 50 },
  { id: 5, title: 'Task 6', complete: 60 },
  { id: 6, title: 'Task 3', complete: 160 },
  { id: 7, title: 'Task 3', complete: 60 },
  { id: 8, title: 'Task 3', complete: 160 },
  { id: 9, title: 'Task 3', complete: 60 },
  { id: 10, title: 'Task 3', complete: 60 },
  { id: 11, title: 'Task 3', complete: 60 },
  { id: 12, title: 'Task 3', complete: 60 },
  { id: 13, title: 'Task 3', complete: 60 },
  { id: 14, title: 'Task 3', complete: 60 },
  { id: 15, title: 'Task 3', complete: 60 },
  { id: 16, title: 'Task 3', complete: 60 },
  { id: 17, title: 'Task 3', complete: 60 },
  { id: 18, title: 'Task 3', complete: 60 },
  { id: 19, title: 'Task 3', complete: 60 },
  { id: 20, title: 'Task 3', complete: 60 },
  { id: 21, title: 'Task 3', complete: 60 },
  { id: 22, title: 'Task 3', complete: 60 },
];

class Example extends React.Component<any, any> {
  //
  state = { rows };

  onGridRowsUpdated = ({ fromRow, toRow, updated }) => {
    console.log('====onGridRowsUpdated, ', updated);

    this.setState(state => {
      const rows = state.rows.slice();
      for (let i = fromRow; i <= toRow; i++) {
        rows[i] = { ...rows[i], ...updated };
      }
      return { rows };
    });
  };

  render() {
    return (
      <ReactDataGrid
        columns={columns}
        rowGetter={i => this.state.rows[i]}
        // rowsCount={3}
        rowsCount={rows.length}
        onGridRowsUpdated={this.onGridRowsUpdated}
        enableCellSelect={true}
      />
    );
  }
}

export default Example;
