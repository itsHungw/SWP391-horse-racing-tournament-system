# File Storage

## 1. Strategies

| Environment | Strategy |
| --- | --- |
| Development | local filesystem |
| Production | cloud object storage |

## 2. Categories

| Category | Max size |
| --- | ---: |
| Avatar | 2 MB |
| Horse image | 5 MB |
| Tournament banner | 5 MB |
| Evidence | 10 MB |

## 3. Validation

- category must be recognized,
- extension and MIME type must be allowed,
- size limit must be enforced,
- file names must reject traversal attempts.

## 4. Service boundary

Use a `FileStorageService` abstraction so local and cloud implementations can be swapped without changing business modules.

