# Type Refactoring Plan: From Naked Strings to Typed Constants

## Overview

This document outlines the systematic approach used to refactor the `TableAlignment` type from naked string comparisons to properly typed constants. This plan can be applied to other similar type refactoring tasks.

## The Problem

- Code was using naked string values like `'H'` and `'V'` directly in comparisons
- String comparisons like `tableAlignment === 'H'` were scattered throughout the codebase
- No type safety - typos or incorrect values wouldn't be caught at compile time
- Poor maintainability and refactoring safety

## The Solution Pattern

### 1. Define Const Object and Type

```typescript
// In types.ts
export const TableAlignment = {
    V: 'V',
    H: 'H',
} as const;

export type TableAlignment = (typeof TableAlignment)[keyof typeof TableAlignment];
```

### 2. Search for Usage Patterns

Use systematic searching to find all naked string usages:

```bash
# Find naked string comparisons
grep -r "===\s*['\"](H|V)['\"]" src/
grep -r "!==\s*['\"](H|V)['\"]" src/

# Find any naked string literals
grep -r "['\"](H|V)['\"]" src/
```

### 3. Refactoring Steps

#### Step 1: Import the type where needed

```typescript
// Before
import { SomeOtherType } from '../types';

// After
import { SomeOtherType, TableAlignment } from '../types';
```

#### Step 2: Replace naked arrays/options

```typescript
// Before
const options = ['V', 'H'];

// After
const options: TableAlignment[] = [TableAlignment.V, TableAlignment.H];
```

#### Step 3: Update state declarations

```typescript
// Before
const [alignment, setAlignment] = useState('V');

// After
const [alignment, setAlignment] = useState<TableAlignment>(TableAlignment.V);
```

#### Step 4: Replace comparisons

```typescript
// Before
if (tableAlignment === 'H') { ... }
const divideBy = tableAlignment === 'V' ? 4 : 1;

// After
if (tableAlignment === TableAlignment.H) { ... }
const divideBy = tableAlignment === TableAlignment.V ? 4 : 1;
```

#### Step 5: Update function parameters and object keys

```typescript
// Before - function parameter
function myFunc(alignment: string) { ... }

// After - function parameter
function myFunc(alignment: TableAlignment) { ... }

// Before - object with string keys
const config = {
    'H': '90deg',
    'V': '270deg'
};

// After - object with computed property names
const config = {
    [TableAlignment.H]: '90deg',
    [TableAlignment.V]: '270deg'
};
```

### 4. Handle Generic Components

If using with generic components (like CSSelect), ensure the component supports generics:

```typescript
// Make component generic
export type SelectProps<T = string> = {
    value: T;
    onChange: (value: T) => void;
    options: T[];
};

const CSSelect = <T = string,>(props: SelectProps<T>) => { ... };

// Use with specific type
<CSSelect<TableAlignment>
    value={alignment}
    onChange={setAlignment}
    options={[TableAlignment.V, TableAlignment.H]}
/>
```

### 5. Verification Steps

1. **Search for remaining naked strings**:

    ```bash
    grep -r "===\s*['\"](H|V)['\"]" src/  # Should return no results
    ```

2. **Run TypeScript compiler**:

    ```bash
    npm run typecheck  # or tsc --noEmit
    ```

3. **Check for runtime errors**:
    - Test all affected functionality
    - Ensure dropdowns/selects still work correctly

## Checklist for Any Type Refactoring

- [ ]   1. Define const object with `as const` assertion
- [ ]   2. Define corresponding type using `typeof` and `keyof`
- [ ]   3. Search for all naked string usage patterns
- [ ]   4. Import the new type in all affected files
- [ ]   5. Replace naked arrays/options with typed arrays
- [ ]   6. Update state declarations with proper typing
- [ ]   7. Replace all string comparisons with constant references
- [ ]   8. Update function parameters to use the new type
- [ ]   9. Convert object keys from strings to computed properties
- [ ]   10. Update generic components if needed
- [ ]   11. Verify no naked strings remain
- [ ]   12. Run TypeScript compiler to check for errors
- [ ]   13. Test functionality to ensure nothing broke

## Benefits Achieved

1. **Type Safety**: Compile-time errors for typos or invalid values
2. **Better IntelliSense**: IDE autocomplete for valid values
3. **Refactoring Safety**: Renaming constants updates all usages
4. **Maintainability**: Single source of truth for valid values
5. **Documentation**: Clear enumeration of valid options

## Files Changed in TableAlignment Refactoring

- `src/routes/~chart/types.ts` - Already had the constants defined
- `src/routes/~chart/components/OrderBook.tsx` - Updated imports, state, comparisons
- `src/routes/~chart/utils.ts` - Updated function parameter and object keys
- `src/components/UI/CSSelect/CSSelect.tsx` - Made generic to support typed values

This pattern can be applied to any similar const-based enums like `OrderbookType`, theme names, status values, etc.
