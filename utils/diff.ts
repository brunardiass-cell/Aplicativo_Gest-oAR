
// Este utilitário fornece funções para gerar um "diff" (diferença) entre dois objetos
// e para aplicar esse diff a um objeto para atualizá-lo. É a base para a lógica de merge.

export interface Diff {
  path: (string | number)[];
  type: 'UPDATE' | 'CREATE' | 'DELETE';
  value?: any; // O novo valor para CREATE/UPDATE
  oldValue?: any; // O valor antigo para DELETE/UPDATE
}

// Uma verificação de igualdade profunda simples usando JSON.stringify.
// Adequada para objetos serializáveis em JSON sem funções ou undefined.
function isEqual(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

// Gera um array de diferenças entre dois objetos (base e a versão atual).
export function generateDiff(base: any, current: any): Diff[] {
  const diffs: Diff[] = [];

  function compare(obj1: any, obj2: any, path: (string | number)[] = []) {
    if (isEqual(obj1, obj2)) {
      return;
    }

    // Se não forem objetos, é uma atualização simples de valor.
    if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
      diffs.push({ path, type: 'UPDATE', oldValue: obj1, value: obj2 });
      return;
    }

    // Lógica para comparar arrays.
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      const maxLength = Math.max(obj1.length, obj2.length);
      for (let i = 0; i < maxLength; i++) {
        if (i >= obj1.length) {
          // Item adicionado ao final do array.
          diffs.push({ path: [...path, i], type: 'CREATE', value: obj2[i] });
        } else if (i >= obj2.length) {
          // Item removido do final do array.
          diffs.push({ path: [...path, i], type: 'DELETE', oldValue: obj1[i] });
        } else {
          // Compara itens no mesmo índice.
          compare(obj1[i], obj2[i], [...path, i]);
        }
      }
    } else {
      // Lógica para comparar objetos.
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

// Aplica um array de diffs a um objeto alvo, retornando um novo objeto com as alterações.
export function applyDiff(target: any, diffs: Diff[]): any {
  // Cria uma cópia profunda para não modificar o objeto original.
  const newTarget = JSON.parse(JSON.stringify(target));

  for (const diff of diffs) {
    let current = newTarget;
    // Navega até o penúltimo nível do caminho.
    for (let i = 0; i < diff.path.length - 1; i++) {
      current = current[diff.path[i]];
    }
    const finalKey = diff.path[diff.path.length - 1];

    switch (diff.type) {
      case 'UPDATE':
      case 'CREATE':
        current[finalKey] = diff.value;
        break;
      case 'DELETE':
        if (Array.isArray(current)) {
          // Remove o item do array pelo índice.
          current.splice(finalKey as number, 1);
        } else {
          // Deleta a propriedade do objeto.
          delete current[finalKey];
        }
        break;
    }
  }
  return newTarget;
}
