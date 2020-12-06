// reselect的简单实现
// ref: https://zhuanlan.zhihu.com/p/78188601
/**
 * 比较两次的参数是否相等
 * @param a 上次的参数
 * @param b 最新参数
 */
function defaultEqualityCheck(a, b) {
  return a === b;
}

function areArgumentsShallowlyEqual(equalityCheck, prev, next) {
  if (prev === null || next === null || prev.length !== next.length) {
    return false;
  }

  // Do this in a for loop (and not a `forEach` or an `every`) so we can determine equality as fast as possible.
  const length = prev.length;
  for (let i = 0; i < length; i++) {
    if (!equalityCheck(prev[i], next[i])) {
      return false;
    }
  }

  return true;
}

/**
 * 记忆函数，即函数能够记住最后一次调用的值，如果下一次调用的参数、方法等相同，则不实际运行该函数，而是直接返回上一次的结果，从而提升性能
 * @param func 要执行的函数，计算结果会被
 */
function defaultMemoize(func) {
  let lastArgs = null;
  let lastResult = null;
  return function() {
    if (!areArgumentsShallowlyEqual(defaultEqualityCheck, lastArgs, arguments)) {
      lastResult = func.apply(null, arguments);
    }
    lastArgs = arguments;
    return lastResult;
  };
}

/**
 *  一个闭包工具函数
 * @param funcs 要计算的函数
 */
export const createSelector = function(...funcs) {
  // 最后要执行的函数
  const resultFunc = funcs.pop();
  // 参数中前面的函数，它们的计算结果会作为最后一个函数的输入参数
  const dependencies = funcs;
  // resultFunc函数重新计算的次数
  let recomputations = 0;

  // 最终会返回的对象
  const selector: any = defaultMemoize(function() {
    const params = [];
    const length = dependencies.length;
    // 每次重新计算都会增加1
    recomputations++;
    // 计算参数中最后一个函数前的其他函数
    for (let i = 0; i < length; i++) {
      params.push(dependencies[i].apply(null, arguments));
    }

    // 最后最终的计算结果
    return resultFunc.apply(null, params);
  });

  selector.recomputations = () => recomputations;
  return selector;
};
