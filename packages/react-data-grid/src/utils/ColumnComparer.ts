import { isElement } from 'react-is';

/**
 * 检测两列数据是否相等，比较的是引用。
 * 若数据值类型是函数或组件，则跳过比较，此时认为相等。
 * @param a 包含A列数据的对象
 * @param b 包含B列数据的对象
 */
export function sameColumn<A extends {}, B extends {}>(a: A, b: B): boolean {
  // 先遍历a属性
  for (const k in a) {
    if (a.hasOwnProperty(k)) {
      const valA = a[k] as unknown;
      const valB = b[(k as string) as keyof B] as unknown;
      if ((typeof valA === 'function' && typeof valB === 'function') || (isElement(valA) && isElement(valB))) {
        continue;
      }
      // 若a有k属性，但b没有k属性或a[k] !== b[k]，则两列内容不相等
      if (!b.hasOwnProperty(k) || valA !== valB) {
        return false;
      }
    }
  }

  // 再遍历b属性
  for (const k in b) {
    if (b.hasOwnProperty(k) && !a.hasOwnProperty(k)) {
      return false;
    }
  }

  return true;
}
