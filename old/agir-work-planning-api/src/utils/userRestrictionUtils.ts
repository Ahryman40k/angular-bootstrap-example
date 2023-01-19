// remove special caracters and return list with lowerCase
// example: MTL => mtl
export function mapRestrictions(restrictions: string[]) {
  return (restrictions || []).map(el => {
    return (el || '').replace(/[^a-zA-Z]/g, '').toLowerCase();
  });
}
