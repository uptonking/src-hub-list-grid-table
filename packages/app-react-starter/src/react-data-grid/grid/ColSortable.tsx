import React from 'react';
import { ReactDataGrid } from '../../incubator/react-data-grid/index';

class Example extends React.Component<any, any> {
  _columns: (
    | { key: string; name: string; frozen: boolean; width?: undefined; sortable?: undefined }
    | { key: string; name: string; width: number; sortable: boolean; frozen?: undefined }
  )[];
  constructor(props, context) {
    super(props, context);
    this._columns = [
      {
        key: 'id',
        name: 'ID',
        frozen: true,
      },
      {
        key: 'task',
        name: 'Title',
        width: 200,
        sortable: true,
      },
      {
        key: 'priority',
        name: 'Priority',
        width: 200,
        sortable: true,
      },
      {
        key: 'issueType',
        name: 'Issue Type',
        width: 200,
        sortable: true,
      },
      {
        key: 'complete',
        name: '% Complete',
        width: 200,
        sortable: true,
      },
      {
        key: 'startDate',
        name: 'Start Date',
        width: 200,
        sortable: true,
      },
      {
        key: 'completeDate',
        name: 'Expected Complete',
        width: 200,
        sortable: true,
      },
    ];

    // const originalRows = this.createRows(1000);
    const originalRows = this.createRows();
    const rows = originalRows.slice(0);
    this.state = { originalRows, rows };
  }

  getRandomDate = (start, end) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toLocaleDateString();
  };

  createRows = () => {
    const rows = [];
    for (let i = 1; i < 1000; i++) {
      rows.push({
        id: i,
        task: `Task ${i}`,
        complete: Math.min(100, Math.round(Math.random() * 110)),
        priority: ['Critical', 'High', 'Medium', 'Low'][Math.floor(Math.random() * 3 + 1)],
        issueType: ['Bug', 'Improvement', 'Epic', 'Story'][Math.floor(Math.random() * 3 + 1)],
        startDate: this.getRandomDate(new Date(2015, 3, 1), new Date()),
        completeDate: this.getRandomDate(new Date(), new Date(2016, 0, 1)),
      });
    }

    return rows;
  };

  handleGridSort = (sortColumn, sortDirection) => {
    const comparer = (a, b) => {
      if (sortDirection === 'ASC') {
        return a[sortColumn] > b[sortColumn] ? 1 : -1;
      }
      if (sortDirection === 'DESC') {
        return a[sortColumn] < b[sortColumn] ? 1 : -1;
      }
      return 0;
    };

    const rows = sortDirection === 'NONE' ? this.state.originalRows.slice(0) : this.state.rows.sort(comparer);

    this.setState({ rows });
  };

  rowGetter = i => {
    return this.state.rows[i];
  };

  render() {
    return (
      <ReactDataGrid
        onGridSort={this.handleGridSort}
        columns={this._columns}
        rowGetter={this.rowGetter}
        rowsCount={this.state.rows.length}
        minHeight={500}
      />
    );
  }
}

export default Example;
