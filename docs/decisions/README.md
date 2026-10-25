# Architecture decision records

Short records of the choices that shaped this project: the context, the decision, and what was
traded away. The guiding rule throughout was **KISS**: use well-known patterns only where they
can be defended for an app of this size, and say what was deliberately left out.

| #                                        | Decision                                               |
| ---------------------------------------- | ------------------------------------------------------ |
| [0001](0001-stack.md)                    | Stack: Vue 3, TypeScript, Vite, Sass, Vitest           |
| [0002](0002-architecture.md)             | Layers: service → mappers → composables → views        |
| [0003](0003-state-and-url.md)            | No store: the URL holds list state, a memo holds films |
| [0004](0004-search-request-lifecycle.md) | Search: debounce, AbortController and a version guard  |
| [0005](0005-related-resources.md)        | Fetching films and residents                           |
| [0006](0006-error-handling.md)           | Error model, timeout and recovery                      |
| [0007](0007-procedural-planet-art.md)    | Planet artwork generated from climate and terrain      |
| [0008](0008-styling.md)                  | Styling: Sass + CSS custom properties, no UI framework |
| [0009](0009-accessibility-ux.md)         | Accessibility and UX details                           |
| [0010](0010-testing.md)                  | Testing strategy                                       |
| [0011](0011-storybook.md)                | Storybook, kept small                                  |
| [0012](0012-motion-and-identity.md)      | Motion (View Transitions) and card identity            |
| [0013](0013-sci-fi-header-and-hero.md)   | Sci-fi header and hero with real archive stats         |

Format: _Context_ (why a decision was needed) → _Decision_ → _Consequences_ (trade-offs,
including what was not done).
