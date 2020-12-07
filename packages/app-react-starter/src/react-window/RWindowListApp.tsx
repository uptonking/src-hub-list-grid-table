import React from 'react';
import { FixedSizeList } from 'react-window';
import './style/rwindow-style.css';

const SimpleRow = ({ index, style }) => (
  <div className={index % 2 ? 'ListItemOdd' : 'ListItemEven'} style={style}>
    Row {index + 1}
  </div>
);

// export class FixedSizeListApp extends React.Component {
//   render() {
//     return (
//       <FixedSizeList className='List' width={480} height={320} itemCount={1000} itemSize={48}>
//         {SimpleRow}
//       </FixedSizeList>
//     );
//   }
// }

export class FixedSizeListApp extends React.Component {
  render() {
    return (
      <FixedSizeList
        className='List'
        width={480}
        height={320}
        itemCount={1000}
        itemSize={48}
        initialScrollOffset={0}
        // layout='horizontal'
      >
        {SimpleRow}
      </FixedSizeList>
    );
  }
}
