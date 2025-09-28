# React Patterns and Best Practices

## Component Patterns

### Functional Components

Functional components with hooks are the modern standard for React development:

```typescript
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);

  return <div>{user?.name}</div>;
}
```

### Custom Hooks

Custom hooks let you extract component logic into reusable functions:

```typescript
function useUser(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchUser(userId)
      .then(setUser)
      .finally(() => setLoading(false));
  }, [userId]);

  return { user, loading };
}
```

## State Management

### useState for Local State

Use `useState` for component-local state:

```typescript
const [count, setCount] = useState(0);
```

### useReducer for Complex State

When state logic becomes complex, use `useReducer`:

```typescript
type State = { count: number; step: number };
type Action = { type: 'increment' } | { type: 'decrement' } | { type: 'setStep'; step: number };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'increment':
      return { ...state, count: state.count + state.step };
    case 'decrement':
      return { ...state, count: state.count - state.step };
    case 'setStep':
      return { ...state, step: action.step };
  }
}
```

### Context for Shared State

Use Context API to share state across components without prop drilling:

```typescript
const ThemeContext = createContext<'light' | 'dark'>('light');

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  return (
    <ThemeContext.Provider value={theme}>
      <Layout />
    </ThemeContext.Provider>
  );
}
```

## Performance Optimization

### React.memo

Prevent unnecessary re-renders with `React.memo`:

```typescript
const ExpensiveComponent = React.memo(({ data }: { data: Data }) => {
  return <div>{/* Complex rendering */}</div>;
});
```

### useMemo

Memoize expensive calculations:

```typescript
const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.value - b.value);
}, [items]);
```

### useCallback

Memoize callback functions to prevent child re-renders:

```typescript
const handleClick = useCallback(() => {
  console.log('Clicked!');
}, []);
```

## Error Boundaries

Error boundaries catch JavaScript errors in component trees:

```typescript
class ErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}
```

## Composition Patterns

### Compound Components

Components that work together:

```typescript
function Tabs({ children }: { children: ReactNode }) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <TabsContext.Provider value={{ activeIndex, setActiveIndex }}>
      {children}
    </TabsContext.Provider>
  );
}

Tabs.List = function TabsList({ children }: { children: ReactNode }) {
  return <div role="tablist">{children}</div>;
};

Tabs.Tab = function Tab({ index, children }: { index: number; children: ReactNode }) {
  const { activeIndex, setActiveIndex } = useContext(TabsContext);
  return (
    <button
      role="tab"
      aria-selected={activeIndex === index}
      onClick={() => setActiveIndex(index)}
    >
      {children}
    </button>
  );
};
```

### Render Props

Pass rendering logic as a prop:

```typescript
function DataLoader({
  url,
  render
}: {
  url: string;
  render: (data: Data | null, loading: boolean) => ReactNode
}) {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [url]);

  return <>{render(data, loading)}</>;
}
```