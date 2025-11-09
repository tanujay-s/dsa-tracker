---

### `concepts/two-pointers.md`
```md
# Two Pointers Variations

**When:** sorted arrays, palindrome checks, pair/triple sums, in-place partitioning.

## Patterns
- **Opposite ends**: sum compare with target
- **Same direction**: dedupe, remove conditionally
- **Fast/slow**: cycle detection (Floyd)

## C++ Template (two-sum sorted)
```cpp
int l=0,r=n-1;
while(l<r){
  long long s=a[l]+a[r];
  if(s==x) return 1;
  (s<x)? l++ : r--;
}
