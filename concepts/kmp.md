---

### `concepts/kmp.md`
```md
# KMP (Prefix Function)

**Goal:** pattern matching in O(n+m)

## π-function
`pi[i]` = length of longest proper prefix which is also suffix for `s[0..i]`.

## Build π
```cpp
vector<int> pi(m);
for(int i=1;i<m;i++){
  int j=pi[i-1];
  while(j>0 && p[i]!=p[j]) j=pi[j-1];
  if(p[i]==p[j]) j++;
  pi[i]=j;
}
