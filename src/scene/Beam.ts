import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { CONFIG } from '../config';

/**
 * The thin glowing beam from the pointing fingertip to where it meets the
 * object. A single additive fat-line segment in world space, updated each frame;
 * bloom does the rest. Hidden when not pointing.
 */
export class Beam {
  public readonly mesh: LineSegments2;
  private geometry: LineSegmentsGeometry;
  private material: LineMaterial;

  constructor() {
    this.geometry = new LineSegmentsGeometry();
    this.geometry.setPositions([0, 0, 0, 0, 0, 0.001]);

    this.material = new LineMaterial({
      color: 0xffffff,
      linewidth: CONFIG.beam.lineWidth,
      worldUnits: true,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      opacity: CONFIG.beam.coreOpacity,
    });

    this.mesh = new LineSegments2(this.geometry, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 3;
    this.mesh.visible = false;
  }

  setEndpoints(a: THREE.Vector3, b: THREE.Vector3): void {
    this.geometry.setPositions([a.x, a.y, a.z, b.x, b.y, b.z]);
  }

  setVisible(v: boolean): void {
    this.mesh.visible = v;
  }

  setColor(c: THREE.Color): void {
    this.material.color.copy(c);
  }

  setResolution(w: number, h: number): void {
    this.material.resolution.set(w, h);
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
