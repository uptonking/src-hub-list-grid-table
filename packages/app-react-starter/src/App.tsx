import React from 'react';
// import { CheckboxWithLabel } from '@examples-hub/sample-react-components-ts';
import * as examples from '.';

import './index.css';

const exampleNameArr = Object.keys(examples);

console.log('==exampleNameArr, ', exampleNameArr);

// export function App() {
//   return (
//     <div>
//       <h1>本项目 react-monorepo-starter-ts</h1>
//       <div>
//         <input type='text' />
//       </div>
//       <div>
//         {/* <CheckboxWithLabel labelOn='On' labelOff='Off' /> */}
//         <RDGSimpleListApp />
//       </div>
//     </div>
//   );
// }

export class App extends React.Component {
  state = { currentExampleName: 'RDGSimpleListApp' };
  // state = { currentExampleName: 'RDGSimpleEditApp' };

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
          <blockquote>list/grid Examples</blockquote>
        </div>
        <h2>{curName}</h2>
        <div
          style={{ float: 'left', backgroundColor: 'beige', padding: '6px' }}
          className='left-toc-placeholder'
        >
          {exampleNameArr.map((name, index) => (
            <div onClick={() => this.handleClick(name)} key={index + name}>
              <h5 style={{ cursor: 'pointer' }}>{name}</h5>
            </div>
          ))}
        </div>
        {/* width必须存在，height可不存在，且width不能是auto */}
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

export default App;
