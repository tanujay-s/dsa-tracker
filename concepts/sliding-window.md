# Sliding Window (All Types)

**When:** contiguous subarray/string problems with constraints like fixed size `k`, “at most k distinct”, “longest/shortest…”.

## Patterns
- **Fixed size `k`**: expand to k, move both ends (+ add/remove effects).
- **Variable size (longest with constraint)**: expand `r`, while invalid shrink `l`.
- **At most / at least k distinct**: use freq map; `atLeast(k) = total - atMost(k-1)`.

## C++ Template (variable window)
```cpp
int best=0; unordered_map<char,int> f; int l=0;
for(int r=0;r<n;r++){
  f[s[r]]++;
  while(/* invalid */){
    if(--f[s[l]]==0) f.erase(s[l]);
    l++;
  }
  best=max(best, r-l+1);
}
