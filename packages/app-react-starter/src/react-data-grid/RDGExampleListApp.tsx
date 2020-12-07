import React from 'react';
import * as examples from './grid';

// import 'react-data-grid/rdg-bootstrap-3.3.7-custom.css';
// import 'react-data-grid/rdg-main.css';

const exampleNameArr = Object.keys(examples);

export class RDGExampleListApp extends React.Component {
  state = { currentExampleName: 'BasicCellEditSimple' };
  // state = { currentExampleName: 'EgCustomFilter' };

  handleClick = (name) => {
    this.setState({
      currentExampleName: name,
    });
  };

  render() {
    const curName = this.state.currentExampleName;
    const CurExampleApp: React.ComponentType = curName
      ? examples[curName]
      : () => <h4>未选择示例</h4>;
    return (
      <div>
        <div>
          <blockquote>ReactDataGrid Examples</blockquote>
        </div>
        <h2>{curName}</h2>
        <div
          style={{ float: 'left', backgroundColor: 'snow', padding: '6px' }}
          className='left-toc-placeholder'
        >
          {exampleNameArr.map((name, index) => (
            <div onClick={() => this.handleClick(name)} key={index + name}>
              <h5 style={{ cursor: 'pointer' }}>{name}</h5>
            </div>
          ))}
        </div>
        {/* width必须存在，height可不存在 */}
        <div
          style={{ float: 'left', margin: '10px', width: '70%' }}
          className='right-comp-placeholder'
        >
          <CurExampleApp />
        </div>
      </div>
    );
  }
}
