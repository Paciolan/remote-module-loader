interface Requires {
  (name: string): any;
}

interface CreateRequires {
  (dependencies?: object): Requires;
}

export const createRequires: CreateRequires = dependencies => name => {
  const _dependencies = dependencies || {};

  if (!(name in _dependencies)) {
    throw new Error(
      `Could not require '${name}'. '${name}' does not exist in dependencies.`
    );
  }

  return _dependencies[name];
};
