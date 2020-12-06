import React from 'react';
import ReactDOM from 'react-dom';
import { makeData } from '../util/mockDataUtil';
import { ReactDataGrid, ColumnList } from '../../incubator/react-data-grid/index';
// import '../../incubator/react-data-grid/react-data-grid-header.css';

export class HeaderSuperGroup extends React.Component {
  render() {
    const rows = makeData(13);

    const columns = [
      { key: 'firstName', name: 'First Name' },
      { key: 'lastName', name: 'Last Name' },
      { key: 'age', name: 'Age' },
      { key: 'status', name: 'Status' },
      { key: 'visits', name: 'Visits' },
      { key: 'progress', name: 'Progress' },
    ];
    const superHeaders = [
      {
        key: 'userName',
        name: 'User Name',
        span: 2,
      },
      {
        key: 'userDetails',
        name: 'User Details',
        span: 4,
      },
    ];

    return (
      // <div>
      <ReactDataGrid
        columns={columns}
        superHeaders={superHeaders}
        rowGetter={i => rows[i]}
        rowsCount={rows.length}
        minWidth={800}
      />
      // </div>
    );
  }
}

export default HeaderSuperGroup;
