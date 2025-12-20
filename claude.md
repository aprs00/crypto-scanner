# Project Guidelines

## React

- Never use `useMemo` or `useCallback` - React Compiler handles memoization automatically.
- Prefer inline conditional rendering using `&&` and `||` over if statements:
    ```tsx
    const displayValue = (condition1 && <Component1 />) || (condition2 && <Component2 />) || <DefaultComponent />;
    ```
