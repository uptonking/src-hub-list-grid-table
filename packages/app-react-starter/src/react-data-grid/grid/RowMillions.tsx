import React from 'react';
import { ReactDataGrid } from '../../incubator/react-data-grid/index';

class Example extends React.Component<any, any> {
  _columns: { key: string; name: string }[];
  _rows: any[];
  constructor(props, context) {
    super(props, context);
    this.createRows();
    this._columns = [
      { key: 'id', name: 'ID' },
      { key: 'task', name: 'Title' },
      { key: 'priority', name: 'Priority' },
      { key: 'issueType', name: 'Issue Type' },
      { key: 'complete', name: '% Complete' },
    ];

    this.state = null;
  }

  createRows = () => {
    const rows = [];
    for (let i = 1; i < 1000000; i++) {
      rows.push({
        id: i,
        task: `Task ${i}`,
        complete: 'a',
        priority: 'b',
        issueType: 'c',
      });
    }

    this._rows = rows;
  };

  rowGetter = i => {
    return this._rows[i];
  };

  render() {
    return (
      <ReactDataGrid columns={this._columns} rowGetter={this.rowGetter} rowsCount={this._rows.length} minHeight={500} />
    );
  }
}

export default Example;
