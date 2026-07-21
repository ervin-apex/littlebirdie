"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { assetPath } from "@/lib/site";

export type BirdeeClipName =
  | "ready_hover"
  | "encouraging_lift"
  | "concerned_settle"
  | "focused_lean"
  | "curious_tilt"
  | "attentive_settle";

type Runtime = {
  mixer: THREE.AnimationMixer;
  actions: Map<string, THREE.AnimationAction>;
  currentAction: THREE.AnimationAction | null;
  presentation: THREE.Group;
};

export function BirdeeMotionStage({
  clip,
  replayToken,
  reducedMotion,
  onReady,
}: {
  clip: BirdeeClipName;
  replayToken: number;
  reducedMotion: boolean;
  onReady?: (clipNames: string[]) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<Runtime | null>(null);
  const desiredRef = useRef({ clip, reducedMotion });
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const playClip = (name: BirdeeClipName, shouldReduceMotion: boolean) => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    const next = runtime.actions.get(name);
    if (!next) return;

    const previous = runtime.currentAction;
    if (previous && previous !== next) {
      previous.fadeOut(shouldReduceMotion ? 0 : 0.14);
    }

    next.enabled = true;
    next.paused = false;
    next.reset();
    next.setEffectiveWeight(1);
    next.setEffectiveTimeScale(1);
    if (name === "ready_hover" && !shouldReduceMotion) {
      next.setLoop(THREE.LoopRepeat, Number.POSITIVE_INFINITY);
      next.clampWhenFinished = false;
    } else {
      next.setLoop(THREE.LoopOnce, 1);
      next.clampWhenFinished = true;
    }
    next.fadeIn(shouldReduceMotion ? 0 : 0.18).play();

    if (shouldReduceMotion) {
      next.time = name === "ready_hover" ? 0 : next.getClip().duration;
      next.paused = true;
      runtime.mixer.update(0);
    }
    runtime.currentAction = next;
  };

  useEffect(() => {
    desiredRef.current = { clip, reducedMotion };
    playClip(clip, reducedMotion);
    // replayToken intentionally restarts the same clip.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clip, replayToken, reducedMotion]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let animationFrame = 0;
    let visible = true;
    const pointerTarget = new THREE.Vector2();
    let lastFrameTime = performance.now();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 1, 0.01, 100);
    camera.position.set(0, 0.05, 4.3);
    camera.lookAt(0, 0.02, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.className = "birdee-motion-canvas";
    host.appendChild(renderer.domElement);

    const hemisphere = new THREE.HemisphereLight(0xfff6d8, 0x8b9db5, 2.7);
    scene.add(hemisphere);

    const keyLight = new THREE.DirectionalLight(0xfff2c4, 4.6);
    keyLight.position.set(-2.6, 3.8, 4.4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 0.1;
    keyLight.shadow.camera.far = 12;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xb9d7ff, 2.8);
    rimLight.position.set(3.2, 1.4, -2.8);
    scene.add(rimLight);

    const presentation = new THREE.Group();
    presentation.rotation.y = -0.1;
    scene.add(presentation);

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.62, 64),
      new THREE.MeshBasicMaterial({
        color: 0x17243a,
        transparent: true,
        opacity: 0.11,
        depthWrite: false,
      }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.scale.set(1, 0.42, 1);
    shadow.position.set(0, -0.94, 0.02);
    presentation.add(shadow);

    const loader = new GLTFLoader();
    loader.load(
      assetPath("/models/birdee-web-animated-v1.glb"),
      (gltf) => {
        if (disposed) return;
        const model = gltf.scene;
        model.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return;
          child.castShadow = true;
          child.receiveShadow = true;
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          for (const material of materials) {
            if ("map" in material && material.map instanceof THREE.Texture) {
              material.map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
            }
          }
        });

        const bounds = new THREE.Box3().setFromObject(model);
        const center = bounds.getCenter(new THREE.Vector3());
        const size = bounds.getSize(new THREE.Vector3());
        const scale = 1.72 / Math.max(size.y, size.x * 0.92);
        model.position.sub(center);
        model.scale.setScalar(scale);
        presentation.add(model);

        const mixer = new THREE.AnimationMixer(model);
        const actions = new Map<string, THREE.AnimationAction>();
        for (const animation of gltf.animations) {
          actions.set(animation.name, mixer.clipAction(animation));
        }
        runtimeRef.current = { mixer, actions, currentAction: null, presentation };
        playClip(desiredRef.current.clip, desiredRef.current.reducedMotion);
        setStatus("ready");
        onReady?.(Array.from(actions.keys()));
      },
      undefined,
      () => {
        if (!disposed) setStatus("error");
      },
    );

    const resize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting && !document.hidden;
        if (visible) lastFrameTime = performance.now();
      },
      { threshold: 0.05 },
    );
    intersectionObserver.observe(host);

    const handleVisibility = () => {
      visible = !document.hidden;
      if (visible) lastFrameTime = performance.now();
    };
    const handlePointerMove = (event: PointerEvent) => {
      if (desiredRef.current.reducedMotion) return;
      const rect = host.getBoundingClientRect();
      pointerTarget.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      pointerTarget.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    const handlePointerLeave = () => pointerTarget.set(0, 0);
    document.addEventListener("visibilitychange", handleVisibility);
    host.addEventListener("pointermove", handlePointerMove);
    host.addEventListener("pointerleave", handlePointerLeave);

    const render = (time: number) => {
      animationFrame = requestAnimationFrame(render);
      if (!visible) return;
      const delta = Math.min((time - lastFrameTime) / 1000, 0.05);
      lastFrameTime = time;
      const runtime = runtimeRef.current;
      if (runtime) {
        if (!desiredRef.current.reducedMotion) runtime.mixer.update(delta);
        const targetY = desiredRef.current.reducedMotion ? -0.1 : -0.1 + pointerTarget.x * 0.07;
        const targetX = desiredRef.current.reducedMotion ? 0 : -pointerTarget.y * 0.022;
        runtime.presentation.rotation.y = THREE.MathUtils.lerp(runtime.presentation.rotation.y, targetY, 0.055);
        runtime.presentation.rotation.x = THREE.MathUtils.lerp(runtime.presentation.rotation.x, targetX, 0.055);
      }
      renderer.render(scene, camera);
    };
    animationFrame = requestAnimationFrame(render);

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      host.removeEventListener("pointermove", handlePointerMove);
      host.removeEventListener("pointerleave", handlePointerLeave);
      runtimeRef.current?.mixer.stopAllAction();
      runtimeRef.current = null;
      scene.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        child.geometry.dispose();
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        for (const material of materials) material.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [onReady]);

  return (
    <div className="birdee-motion-stage" ref={hostRef}>
      {status === "loading" && (
        <div className="birdee-motion-loading" role="status">
          <span />
          Warming up Birdee…
        </div>
      )}
      {status === "error" && (
        <div className="birdee-motion-fallback" role="status">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={assetPath("/brand/birdee-hero.png")} alt="Little Birdee" />
          <p>The 3D preview could not start. The static fallback is working.</p>
        </div>
      )}
    </div>
  );
}
