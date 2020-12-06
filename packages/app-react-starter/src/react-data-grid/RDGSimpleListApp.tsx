import React from 'react';
import { makeData } from '../util/mockDataUtil';
import { ReactDataGrid } from 'react-data-grid';

import 'react-data-grid/styles/rdg-bootstrap-3.3.7-custom.css';
import 'react-data-grid/styles/rdg-main.css';

// type Roww1 = {
//   id: number;
//   title: string;
//   count: number;
// };

export class RDGListSimpleApp extends React.Component {
  render() {
    console.log('==== RDGListSimpleApp, render() is called unexpectedly');

    // const rows = [
    //   { id: 0, title: 'row1', count: 200 },
    //   { id: 1, title: 'row2', count: 40 },
    //   { id: 2, title: 'row3', count: 60 },
    // ];
    const rows = makeData(13);
    // 推断数组元素的类型，仅在编译阶段存在
    // type Roww = typeof rows[0];
    // const columns = [
    //   { key: 'id', name: 'ID' },
    //   { key: 'title', name: 'Title' },
    //   { key: 'count', name: 'Count' },
    //   // ] as any;
    //   // ] as ColumnList<Roww>;
    // ];
    const columns = [
      { key: 'firstName', name: 'First Name' },
      { key: 'lastName', name: 'Last Name' },
      { key: 'age', name: 'Age' },
      { key: 'status', name: 'Status' },
      { key: 'visits', name: 'Visits' },
      // { key: 'progress', name: 'Progress' },
      // { key: 'progress', name: 'Progress' },
      // { key: 'progress', name: 'Progress' },
      // { key: 'progress', name: 'Progress' },
      // { key: 'progress', name: 'Progress' },
      // { key: 'progress', name: 'Progress' },
      // { key: 'progress', name: 'Progress' },
      // { key: 'progress', name: 'Progress' },
    ];

    return (
      // <div>
      <ReactDataGrid
        columns={columns}
        rowGetter={(i) => rows[i]}
        rowsCount={rows.length}
        // minWidth={800}
        // enableCellSelect={true}
      />
      // </div>
    );
  }
}

const rows = [
  { id: 0, title: 'Task 1', complete: 10 },
  { id: 1, title: 'Task 2', complete: 20 },
  { id: 2, title: 'Task 3', complete: 30 },
  { id: 3, title: 'Task 4', complete: 40 },
  { id: 4, title: 'Task 5', complete: 50 },
  { id: 5, title: 'Task 6', complete: 60 },
  { id: 6, title: 'Task 7', complete: 70 },
  { id: 7, title: 'Task 8', complete: 80 },
  { id: 8, title: 'Task 9', complete: 90 },
  { id: 9, title: 'Task 10', complete: 10 },
  { id: 10, title: 'Task 11', complete: 10 },
  { id: 11, title: 'Task 12', complete: 20 },
  { id: 12, title: 'Task 13', complete: 30 },
  { id: 13, title: 'Task 14', complete: 40 },
  { id: 14, title: 'Task 15', complete: 50 },
  { id: 15, title: 'Task 16', complete: 60 },
  { id: 16, title: 'Task 17', complete: 70 },
  { id: 17, title: 'Task 18', complete: 80 },
  { id: 18, title: 'Task 19', complete: 90 },
  { id: 19, title: 'Task 10', complete: 20 },
  { id: 20, title: 'Task 3', complete: 60 },
  { id: 21, title: 'Task 3', complete: 60 },
  { id: 22, title: 'Task 3', complete: 60 },
];

export class RDGListEditApp extends React.Component<any, any> {
  // 表格初始数据，是行对象的数组
  state = { rows };

  // 表格数据更新时会调用此方法修改state中的数据源
  onGridRowsUpdated = ({ fromRow, toRow, updated }) => {
    this.setState((state) => {
      const rowsCopy = state.rows.slice();
      for (let i = fromRow; i <= toRow; i++) {
        rowsCopy[i] = { ...rowsCopy[i], ...updated };
      }
      return { rows: rowsCopy };
    });
  };

  render() {
    const columns = [
      { key: 'id', name: 'ID', editable: true },
      { key: 'title', name: 'Title', editable: true },
      { key: 'complete', name: 'Complete(<100)', editable: false },
    ];

    return (
      <ReactDataGrid
        columns={columns}
        rowGetter={(i) => this.state.rows[i]}
        rowsCount={rows.length}
        // rowsCount={3}
        onGridRowsUpdated={this.onGridRowsUpdated}
        enableCellSelect={true}
        // minWidth={800}
      />
    );
  }
}
