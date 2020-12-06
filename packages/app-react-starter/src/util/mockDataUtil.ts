const range = len => {
  const arr = [];
  for (let i = 0; i < len; i++) {
    arr.push(i);
  }
  return arr;
};

// 以对象字面量的方式，创建并返回一个对象
const newPerson = () => {
  const statusChance = Math.random();
  return {
    firstName: `FirstName ${statusChance.toFixed(1)}`,
    lastName: `LastN ${statusChance.toFixed(1)}`,
    age: Math.floor(Math.random() * 30),
    visits: Math.floor(Math.random() * 100),
    progress: Math.floor(Math.random() * 100),
    status: statusChance > 0.66 ? 'relationship' : statusChance > 0.33 ? 'complicated' : 'single',
  };
};

export function makeData(len = 5553) {
  return range(len).map(d => ({
    ...newPerson(),
    children: range(2).map(newPerson),
  }));
}
