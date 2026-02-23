
// Lógica de Diff/Patch aprimorada e com tipagem segura para lidar com arrays de objetos baseados em ID.

export type IdPathSegment = { id: string };
export type PathSegment = string | number | IdPathSegment;

export interface Diff {
  path: PathSegment[];
  type: 'UPDATE' | 'CREATE' | 'DELETE';
  value?: any; 
  oldValue?: any;
}

// Tipagem para um item genérico com um ID, para satisfazer o compilador TS.
interface ItemWithId {
    id: string;
    [key: string]: any;
}

function isEqual(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function generateDiff(base: any, current: any): Diff[] {
  const diffs: Diff[] = [];

  function compare(obj1: any, obj2: any, path: PathSegment[] = []) {
    if (isEqual(obj1, obj2)) return;

    if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
      diffs.push({ path, type: 'UPDATE', oldValue: obj1, value: obj2 });
      return;
    }

    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      const arr1 = obj1 as ItemWithId[];
      const arr2 = obj2 as ItemWithId[];
      const canUseId = arr1.every(item => typeof item === 'object' && item?.id) &&
                       arr2.every(item => typeof item === 'object' && item?.id);

      if (canUseId) {
        const map1 = new Map(arr1.map(item => [item.id, item]));
        const map2 = new Map(arr2.map(item => [item.id, item]));
        const allIds = new Set([...map1.keys(), ...map2.keys()]);

        for (const id of allIds) {
          const item1 = map1.get(id);
          const item2 = map2.get(id);
          const newPath = [...path, { id }];

          if (!item1) {
            diffs.push({ path: newPath, type: 'CREATE', value: item2 });
          } else if (!item2) {
            diffs.push({ path: newPath, type: 'DELETE', oldValue: item1 });
          } else {
            compare(item1, item2, newPath);
          }
        }
      } else {
        if (obj1.length !== obj2.length) {
            diffs.push({ path, type: 'UPDATE', oldValue: obj1, value: obj2 });
        } else {
            for(let i=0; i<obj1.length; i++) {
                compare(obj1[i], obj2[i], [...path, i]);
            }
        }
      }
    } else { 
      const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
      for (const key of allKeys) {
        if (!(key in obj1)) {
          diffs.push({ path: [...path, key], type: 'CREATE', value: obj2[key] });
        } else if (!(key in obj2)) {
          diffs.push({ path: [...path, key], type: 'DELETE', oldValue: obj1[key] });
        } else {
          compare(obj1[key], obj2[key], [...path, key]);
        }
      }
    }
  }

  compare(base, current);
  return diffs;
}

export function applyDiff(target: any, diffs: Diff[]): any {
  const newTarget = JSON.parse(JSON.stringify(target));

  for (const diff of diffs) {
    let currentParent: any = null;
    let current: any = newTarget;
    let lastSegment: PathSegment | null = null;

    for (const segment of diff.path) {
      currentParent = current;
      lastSegment = segment;
      if (typeof segment === 'object' && segment !== null && 'id' in segment) {
        if (!Array.isArray(current)) throw new Error('Caminho de ID inválido; o alvo não é um array.');
        current = (current as ItemWithId[]).find(item => item.id === segment.id);
      } else {
        current = current[segment as string | number];
      }
    }

    if (lastSegment === null) continue;

    const finalKey = lastSegment as string | number;

    switch (diff.type) {
      case 'CREATE':
        if (typeof lastSegment === 'object' && lastSegment !== null && 'id' in lastSegment) {
          if (!Array.isArray(currentParent)) throw new Error('Pai de criação de ID inválido.');
          currentParent.push(diff.value);
        } else {
          currentParent[finalKey] = diff.value;
        }
        break;
      case 'UPDATE':
        if (currentParent && finalKey) {
          currentParent[finalKey] = diff.value;
        }
        break;
      case 'DELETE':
        if (typeof lastSegment === 'object' && lastSegment !== null && 'id' in lastSegment) {
          if (!Array.isArray(currentParent)) throw new Error('Pai de exclusão de ID inválido.');
          const index = (currentParent as ItemWithId[]).findIndex(item => item.id === lastSegment.id);
          if (index > -1) currentParent.splice(index, 1);
        } else {
          delete currentParent[finalKey];
        }
        break;
    }
  }
  return newTarget;
}

export const formatPath = (path: PathSegment[]): string => {
  return path.map(segment => {
    if (typeof segment === 'object' && segment !== null && 'id' in segment) {
      return `[id=${segment.id}]`;
    }
    if (typeof segment === 'number') {
      return `[${segment}]`;
    }
    return `.${segment}`;
  }).join('').replace(/^\./, '');
};
