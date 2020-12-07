// Pulled from react-compat
// https://github.com/developit/preact-compat/blob/7c5de00e7c85e2ffd011bf3af02899b63f699d3a/src/index.js#L349
export default function shallowDiffers(prev: Record<string, any>, next: Record<string, any>): boolean {
  // 遍历前一个对象的所有属性名，若有一个属性名不在next对象属性名中，则认为两对象不同，注意后一个对象属性名可能更多
  for (const attribute in prev) {
    if (!(attribute in next)) {
      return true;
    }
  }
  // 遍历后一个对象的所有属性，若属性值不等，则认为两对象不同，注意只比较属性值的引用
  for (const attribute in next) {
    if (prev[attribute] !== next[attribute]) {
      return true;
    }
  }

  return false;
}
