import * as THREE from 'three';

// Ordered translations preserve every existing axis separation for the whole
// continuous path. Initially nested envelopes separate without increasing overlap.
export function planExplosion(items, gap=.12) {
  const axes=['x','y','z'];
  const centers=items.map(p=>p.bounds.getCenter(new THREE.Vector3()));
  const offsets=items.map(()=>new THREE.Vector3());
  const orders=axes.map(axis=>items.map((_,i)=>i).sort((a,b)=>centers[a][axis]-centers[b][axis]||items[a].id.localeCompare(items[b].id,undefined,{numeric:true})));
  const ranks=orders.map(order=>new Map(order.map((id,i)=>[id,i])));
  const edges=axes.map(()=>[]);
  for(let a=0;a<items.length;a++)for(let b=a+1;b<items.length;b++){
    // Only overlapping/nearby envelopes need additional separation. Thin axes
    // naturally pull covers, boards and joint discs away from their mating faces.
    const choices=axes.map((axis,k)=>{
      const [lo,hi]=ranks[k].get(a)<ranks[k].get(b)?[a,b]:[b,a];
      return {k,lo,hi,need:items[lo].bounds.max[axis]-items[hi].bounds.min[axis]+gap};
    });
    if(choices.some(c=>c.need<=0))continue;
    let choice=choices.sort((a,b)=>a.need-b.need)[0];
    const ids=[items[a].id,items[b].id];
    if(ids.includes('part-25')&&(ids.includes('part-13')||ids.includes('part-15')))choice=choices.find(c=>c.k===0);
    edges[choice.k].push(choice);
  }
  axes.forEach((axis,k)=>{
    for(let n=0;n<orders[k].length;n++){
      const i=orders[k][n];
      // Monotone displacements on all axes prevent new envelope collisions.
      if(n)offsets[i][axis]=offsets[orders[k][n-1]][axis];
      for(const edge of edges[k])if(edge.hi===i)offsets[i][axis]=Math.max(offsets[i][axis],offsets[edge.lo][axis]+edge.need);
    }
    const mid=(Math.min(...offsets.map(o=>o[axis]))+Math.max(...offsets.map(o=>o[axis])))/2;
    offsets.forEach(o=>o[axis]-=mid);
  });
  return offsets;
}
export function effectiveVisibility(id,hidden,internal,shells,overrides=new Set()){return !hidden.has(id)&&(!internal||!shells.has(id)||overrides.has(id));}
