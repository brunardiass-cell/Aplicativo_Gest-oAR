
// Lógica de 3-Way Merge e Diff baseada em ID para colaboração em tempo real.

export type PathSegment = string | number | { id: string };

export interface Diff {
  path: PathSegment[];
  type: 'UPDATE' | 'CREATE' | 'DELETE';
  value?: any; 
  oldValue?: any;
  id?: string; // ID do objeto em um array para diffing baseado em ID
}

function isEqual(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

// Mapeia um array de objetos por seu campo 'id'.
function mapById(arr: any[]): Map<string, any> {
  const map = new Map<string, any>();
  if (!Array.isArray(arr)) return map;
  for (const item of arr) {
    if (item && typeof item === 'object' && item.id) {
      map.set(item.id, item);
    }
  }
  return map;
}

// Gera um diff entre dois estados, tratando arrays de objetos com base em seus IDs.
export function generateDiff(base: any, current: any): Diff[] {
  const diffs: Diff[] = [];

  function compare(obj1: any, obj2: any, path: PathSegment[] = []) {
    if (isEqual(obj1, obj2)) {
      return;
    }

    if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
      diffs.push({ path, type: 'UPDATE', oldValue: obj1, value: obj2 });
      return;
    }

    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      const baseMap = mapById(obj1);
      const currentMap = mapById(obj2);

      // Verifica por itens criados ou atualizados
      for (const [id, currentItem] of currentMap.entries()) {
        if (!baseMap.has(id)) {
          diffs.push({ path: [...path], type: 'CREATE', id, value: currentItem });
        } else {
          const baseItem = baseMap.get(id);
          if (!isEqual(baseItem, currentItem)) {
            // Em vez de um UPDATE genérico no item, mergulha para encontrar as mudanças específicas.
            compare(baseItem, currentItem, [...path, { id }]);
          }
        }
      }

      // Verifica por itens deletados
      for (const [id, baseItem] of baseMap.entries()) {
        if (!currentMap.has(id)) {
          diffs.push({ path: [...path], type: 'DELETE', id, oldValue: baseItem });
        }
      }
    } else {
      const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
      for (const key of allKeys) {
        const newPath = [...path, key];
        if (!(key in obj1)) {
          diffs.push({ path: newPath, type: 'CREATE', value: obj2[key] });
        } else if (!(key in obj2)) {
          diffs.push({ path: newPath, type: 'DELETE', oldValue: obj1[key] });
        } else {
          compare(obj1[key], obj2[key], newPath);
        }
      }
    }
  }

  compare(base, current);
  return diffs;
}

// Aplica um diff a um estado alvo.
export function applyDiff(target: any, diffs: Diff[]): any {
  const newTarget = JSON.parse(JSON.stringify(target));

  for (const diff of diffs) {
    let current = newTarget;
    let parent: any = null;
    let lastKey: PathSegment | undefined = undefined;

    for (const key of diff.path) {
        parent = current;
        lastKey = key;
        if (typeof key === 'object' && key !== null && 'id' in key) {
            // Se for um objeto com ID, encontramos o item correspondente no array.
            current = (current as any[]).find((item: any) => item.id === key.id);
        } else {
            current = current[key as string | number];
        }
    }

    const finalKey = diff.path[diff.path.length - 1];

    switch (diff.type) {
      case 'CREATE':
        if (diff.id && Array.isArray(parent)) {
          parent.push(diff.value);
        } else {
          current[finalKey as any] = diff.value;
        }
        break;
      case 'UPDATE':
        if (typeof lastKey === 'object' && lastKey !== null && 'id' in lastKey) {
            // Se o último segmento for um ID, atualizamos o item no array.
            const index = (parent as any[]).findIndex((item: any) => item.id === lastKey.id);
            if (index > -1) parent[index] = diff.value;
        } else {
            parent[lastKey as any] = diff.value;
        }
        break;
      case 'DELETE':
        if (diff.id && Array.isArray(parent)) {
          const index = parent.findIndex((item: any) => item.id === diff.id);
          if (index > -1) {
            parent.splice(index, 1);
          }
        } else {
          if (typeof lastKey === 'object' && lastKey !== null && 'id' in lastKey) {
             const index = (parent as any[]).findIndex((item: any) => item.id === lastKey.id);
             if (index > -1) parent.splice(index, 1);
          } else {
            delete parent[lastKey as any];
          }
        }
        break;
    }
  }
  return newTarget;
}
