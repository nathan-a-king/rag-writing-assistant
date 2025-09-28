# TypeScript Best Practices

## Type Safety

TypeScript's primary goal is to provide type safety at compile time. Here are some best practices:

### Avoid Using `any`

The `any` type defeats the purpose of TypeScript. Instead, use:
- `unknown` for values of unknown type
- Proper union types for multiple possible types
- Generics for reusable type-safe code

### Use Strict Mode

Always enable strict mode in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

## Interface vs Type

Both interfaces and type aliases can describe object shapes, but they have subtle differences:

- **Interfaces** are better for object-oriented programming and can be extended
- **Type aliases** are more flexible and can represent unions, intersections, and primitives

### When to Use Interfaces

Use interfaces when:
- Defining the shape of objects
- You need declaration merging
- Building class-based APIs

### When to Use Type Aliases

Use type aliases when:
- Creating union or intersection types
- Aliasing primitive types
- Using mapped or conditional types

## Generics

Generics provide a way to create reusable components that work with multiple types.

### Basic Generic Function

```typescript
function identity<T>(arg: T): T {
  return arg;
}
```

### Generic Constraints

You can constrain generic types to ensure they have certain properties:

```typescript
interface HasLength {
  length: number;
}

function logLength<T extends HasLength>(arg: T): void {
  console.log(arg.length);
}
```

## Null Safety

TypeScript's strict null checking helps prevent null and undefined errors:

### Optional Chaining

```typescript
const username = user?.profile?.name;
```

### Nullish Coalescing

```typescript
const displayName = username ?? 'Anonymous';
```

## Type Guards

Type guards help narrow down types in conditional blocks:

### typeof Type Guard

```typescript
function padLeft(value: string, padding: string | number) {
  if (typeof padding === "number") {
    return Array(padding + 1).join(" ") + value;
  }
  return padding + value;
}
```

### instanceof Type Guard

```typescript
if (error instanceof Error) {
  console.error(error.message);
}
```

### Custom Type Guards

```typescript
function isString(value: unknown): value is string {
  return typeof value === 'string';
}
```

## Utility Types

TypeScript provides several utility types for common type transformations:

- `Partial<T>`: Makes all properties optional
- `Required<T>`: Makes all properties required
- `Pick<T, K>`: Picks specific properties
- `Omit<T, K>`: Omits specific properties
- `Record<K, T>`: Creates an object type with specific keys and values