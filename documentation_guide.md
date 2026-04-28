## Documentation

This project uses [TypeDoc](https://typedoc.org/) to generate API
documentation from TSDoc comments in the source. Follow these conventions
when adding or editing comments.

### Tags used in this project

| Tag           | Purpose                                                  |
|---------------|----------------------------------------------------------|
| `@param`      | Describe a function parameter.                           |
| `@returns`    | Describe the return value.                               |
| `@throws`     | Describe an error the function may throw.                |
| `@typeParam`  | Describe a generic type parameter.                       |
| `{@link Foo}` | Inline cross-reference to another documented symbol.     |

### Comment style

- The first line is a one-sentence summary; TypeDoc uses it on index pages.
- Leave a blank line between the description and the first tag.
- Document *intent and invariants*, not what the signature already says.
- Comment every exported symbol. Internal helpers are optional.

### Function template

```ts
/**
 * One-sentence summary of what the function does.
 *
 * Optional longer description: explain why this exists, any invariants
 * the caller must respect, and how it relates to {@link otherFunction}.
 *
 * @typeParam TResponse - Shape of the value resolved by the promise.
 * @param channel - The IPC channel name registered in the main process.
 * @param payload - Serializable data to send. Must be JSON-safe.
 * @param timeoutMs - Reject after this many milliseconds. Defaults to 5000.
 * @returns A promise that resolves with the main process response.
 * @throws {@link IpcTimeoutError} If no response arrives within `timeoutMs`.
 */
export async function sendRequest<TResponse>(
  channel: string,
  payload: unknown,
  timeoutMs: number = 5000,
): Promise<TResponse> {
  // implementation
}
```

### React component template

Document the component above its declaration, and document each prop
on its interface field. TypeDoc will render the prop descriptions as
part of the component's API.

```tsx
interface TileProps {
  /** Title shown in the tile header. */
  title: string;
  /** Numeric value displayed prominently. Formatted by {@link formatPower}. */
  value: number;
  /** Unit label appended to the value, e.g. `"kW"`. */
  unit: string;
  /** Optional click handler. When omitted, the tile is non-interactive. */
  onClick?: () => void;
}

/**
 * Dashboard tile that displays a single metric with a title and unit.
 *
 * Used across the dashboard pages to show live values from the main
 * process (battery SoC, fuel cell power, etc.).
 */
export function Tile({ title, value, unit, onClick }: TileProps): JSX.Element {
  // implementation
}
```

### Type and interface template

```ts
/**
 * Snapshot of battery state at a point in time.
 *
 * Produced by {@link batteryQueries} and consumed by the battery page
 * components.
 */
export interface BatterySnapshot {
  /** State of charge as a percentage in the range [0, 100]. */
  soc: number;
  /** Instantaneous power in watts. Positive = charging. */
  power: number;
  /** Cell temperature in degrees Celsius. */
  temperature: number;
}
```

### Generating the docs

```bash
pnpm run docs
```

Output is written to `./docs/` and is git-ignored.
