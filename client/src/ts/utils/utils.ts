export function extend(v, ...args) {
  for(let a in args) 
    for(let k in args[a])
      v[k] = args[a][k] 

  return v
}
