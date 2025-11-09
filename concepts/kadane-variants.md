---

### `concepts/kadane-variants.md`
```md
# Kadane & Variants

## Patterns
- 1D max subarray O(n)
- Circular (max of normal vs total-minSubarray)
- 2D Kadane: fix left/right, run Kadane on row-sum

## C++ (1D)
```cpp
long long best=a[0], cur=a[0];
for(int i=1;i<n;i++){
  cur=max<long long>(a[i], cur+a[i]);
  best=max(best,cur);
}
