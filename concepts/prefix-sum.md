---

### `concepts/prefix-sum.md`
```md
# Prefix / Suffix & Difference Arrays

**When:** Range sums, range updates, subarray counts.

## Patterns
- Prefix sum `pref[i]=pref[i-1]+a[i]`
- **Subarray sum K**: hashmap of prefix counts
- **Difference array**: range add in O(1), rebuild once

## C++ Snippet
```cpp
vector<long long> pref(n+1);
for(int i=0;i<n;i++) pref[i+1]=pref[i]+a[i];
// sum [l..r] = pref[r+1]-pref[l]
