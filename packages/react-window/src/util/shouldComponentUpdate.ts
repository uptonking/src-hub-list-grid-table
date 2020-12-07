import areEqual from './areEqual';
import shallowDiffers from './shallowDiffers';

// 只比较style
// Custom shouldComponentUpdate for class components.
// It knows to compare individual style props and ignore the wrapper object.
// See https://reactjs.org/docs/react-component.html#shouldcomponentupdate
export default function shouldComponentUpdate(
  this: any,
  nextProps: Record<string, any>,
  nextState: Record<string, any>,
): boolean {
  // eslint-disable-next-line babel/no-invalid-this
  return !areEqual(this.props, nextProps) || shallowDiffers(this.state, nextState);
}
