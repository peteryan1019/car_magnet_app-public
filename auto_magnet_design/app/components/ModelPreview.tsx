"use client"

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

interface ModelPreviewProps {
    imgsrc: string,
    carType: string,
    isTwoDoor?: boolean,
    leftSide?: boolean
}

const carTypes = ["small", "medium", "minivan", "suv", "truck"];

export default function ModelPreview({ imgsrc, carType, isTwoDoor = false, leftSide = false }: ModelPreviewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const scene = useRef(new THREE.Scene());
    const cameraRef = useRef<THREE.PerspectiveCamera>(null);
    const carModels = useRef(new Map<string, THREE.Group>());
    const activeModel = useRef<null | THREE.Group>(null);
    const texLoader = useRef(new THREE.TextureLoader());
    const loader = useRef(new GLTFLoader());
    const stickerMat = useRef(new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));

    // Init: set up renderer, camera, lights only — swapModel is NOT called here
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const width = container.clientWidth;
        const height = container.clientHeight;

        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        cameraRef.current = camera;

        const rectLight = new THREE.RectAreaLight(0xffffff, 15, 10, 10);
        rectLight.position.set(5, 5, 5);
        rectLight.lookAt(0, 0, 0);
        scene.current.add(rectLight);

        const rectLight2 = new THREE.RectAreaLight(0xffffff, 15, 10, 10);
        rectLight2.position.set(-5, 5, -5);
        rectLight2.lookAt(0, 0, 0);
        scene.current.add(rectLight2);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true});
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.target = new THREE.Vector3(0,0.6,0);
        controls.enablePan = false;
        controls.enableDamping = true;

        camera.position.set(leftSide ? 2.4 : -2.4, 1.5, 2.4);

        renderer.setAnimationLoop(() => {
            controls.update();
            renderer.render(scene.current, camera);
        });

        const ro = new ResizeObserver(() => {
            const w = container.clientWidth;
            const h = container.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        });
        ro.observe(container);

        return () => {
            ro.disconnect();
            renderer.setAnimationLoop(null);
            renderer.dispose();
            container.removeChild(renderer.domElement);
        };
    }, []);

    // Swap texture whenever imgsrc changes
    useEffect(() => {
        const texture = texLoader.current.load(imgsrc);
        texture.colorSpace = THREE.SRGBColorSpace;
        stickerMat.current.map = texture;
        stickerMat.current.needsUpdate = true;
    }, [imgsrc, leftSide]);

    // Swap model whenever carType / isTwoDoor / leftSide changes.
    // The cancelled flag prevents a stale async load from adding its model
    // if a newer effect has already started.
    useEffect(() => {
        let cancelled = false;

        cameraRef.current?.position.set(leftSide ? 2.4 : -2.4, 1.5, 2.4);
        async function swapModel() {
            const car = carTypes.includes(carType) ? carType : "medium";

            if (!carModels.current.has(car)) {
                const gltf = await loader.current.loadAsync("/models/" + car + ".glb");
                if (cancelled) return;
                carModels.current.set(car, gltf.scene);
            }

            if (cancelled) return;

            // Remove the previous model before adding the new one
            if (activeModel.current) {
                scene.current.remove(activeModel.current);
                activeModel.current = null;
            }

            const model = carModels.current.get(car);
            if (!model) return;

            scene.current.add(model);
            activeModel.current = model;

            // Hide all sticker meshes, then show the correct one
            for (const name of ["sLeft", "sRight", "dsLeft", "dsRight"]) {
                const mesh = scene.current.getObjectByName(name) as THREE.Mesh | undefined;
                if (mesh) mesh.visible = false;
            }

            const stickerName =
                isTwoDoor && leftSide  ? "dsLeft"  :
                isTwoDoor && !leftSide ? "dsRight" :
                !isTwoDoor && leftSide ? "sLeft"   :
                                         "sRight";

            const sticker = scene.current.getObjectByName(stickerName) as THREE.Mesh | undefined;
            if (sticker) {
                sticker.material = stickerMat.current;
                sticker.visible = true;
            }
        }

        swapModel();
        return () => { cancelled = true; };
    }, [carType, isTwoDoor, leftSide]);

    return <>
    <div ref={containerRef} style={{ width: "100%", height: "100%" }}></div>
    <p className="text-slate-500 text-xs">This work is based on &quot;Lowpoly Generic SUV&quot; (https://sketchfab.com/3d-models/lowpoly-generic-suv-edc994ad28ed438cb365c0e0389ac177) by mk2design (https://sketchfab.com/mk2design) licensed under CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/)</p>
    </>
}