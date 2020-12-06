import React from 'react';
import { ReactDataGrid } from '../../incubator/react-data-grid/index';

class EmptyRowsView extends React.Component {
  render() {
    return <div>Nothing to show</div>;
  }
}

class Example extends React.Component<any, any> {
  _rows: any[];
  _columns: { key: string; name: string }[];
  constructor(props) {
    super(props);
    this._rows = [];
    this._columns = [
      { key: 'id', name: 'ID' },
      { key: 'title', name: 'Title' },
      { key: 'count', name: 'Count' },
    ];

    this.state = null;
  }

  rowGetter = i => {
    return this._rows[i];
  };

  render() {
    return (
      <ReactDataGrid
        columns={this._columns}
        rowGetter={this.rowGetter}
        rowsCount={this._rows.length}
        minHeight={500}
        emptyRowsView={EmptyRowsView}
      />
    );
  }
}

export default Example;
