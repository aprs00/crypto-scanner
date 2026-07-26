# Agent Instructions

- Do not run Playwright or other browser automation unless the user explicitly asks to resume it.

# Project Guidelines

- Never use `useMemo` or `useCallback` - React Compiler handles memoization automatically.
- Model finite string domains as typed constants (`export const Foo = { ... } as const` plus a derived `Foo` type), never as hand-written string-literal unions.
- Do not run browser checks; they consume too many tokens. Use build, lint, type, and static checks instead.
- Prefer inline conditional rendering using `&&` and `||` over if statements:
    ```tsx
    const displayValue = (condition1 && <Component1 />) || (condition2 && <Component2 />) || <DefaultComponent />;
    ```
- Extract event handlers (onClick, onChange, etc.) into named functions instead of inline arrow functions:

    ```tsx
    // Good
    const handleClick = () => { ... };
    <button onClick={handleClick}>

    // Bad
    <button onClick={() => { ... }}>
    ```
