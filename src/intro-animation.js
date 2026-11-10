import * as THREE from 'three';

export const INTRO_DURATION = 3000;
const smooth = t => t * t * t * (t * (t * 6 - 15) + 10);

// A separate opening pose: never modify the interactive explosion offsets.
export function createIntroAnimation({parts, group, camera, onComplete}) {
  const offsets = parts.map((part, i) => {
    const center = part.userData.bounds.getCenter(new THREE.Vector3());
    const angle = i * Math.PI * (3 - Math.sqrt(5));
    return new THREE.Vector3(Math.cos(angle), ((i % 5) - 2) * .32, Math.sin(angle))
      .normalize().multiplyScalar(1.25 + (i % 3) * .22)
      .addScaledVector(center, .45);
  });
  let startedAt = null, active = true;
  const bounds = new THREE.Box3();
  parts.forEach((part, i) => bounds.union(part.userData.bounds.clone().translate(offsets[i])));
  const radius = bounds.getBoundingSphere(new THREE.Sphere()).radius + bounds.getCenter(new THREE.Vector3()).length();

  function apply(progress) {
    const eased = smooth(progress), remaining = 1 - eased;
    parts.forEach((part, i) => part.position.copy(offsets[i]).multiplyScalar(remaining));
    // Negative Y is clockwise when viewed from above; finish at the exact home pose.
    group.rotation.y = -Math.PI * 2 * eased;
    const distance = camera.position.length();
    const fit = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
      * Math.sqrt(Math.max(.01, distance * distance - radius * radius))
      / radius * Math.min(1, camera.aspect) * .82;
    camera.zoom = THREE.MathUtils.lerp(Math.min(1, fit), 1, eased);
    camera.updateProjectionMatrix();
  }
  function finish() {
    if (!active) return;
    active = false;
    parts.forEach(part => part.position.set(0, 0, 0));
    group.rotation.y = 0;
    camera.zoom = 1;
    camera.updateProjectionMatrix();
    onComplete?.();
  }
  apply(0);
  return {
    get active() { return active; },
    finish,
    update(now) {
      if (!active) return;
      startedAt ??= now;
      const progress = THREE.MathUtils.clamp((now - startedAt) / INTRO_DURATION, 0, 1);
      if (progress === 1) finish();
      else apply(progress);
    },
  };
}
