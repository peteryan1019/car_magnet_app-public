"use client"

import { useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DecalGeometry } from 'three/examples/jsm/Addons.js';

interface ModelPreviewProps {
    imgsrc: string
}

export default function ModelPreview( {imgsrc}: ModelPreviewProps ) {

    useEffect(() => {
        // setting up the threejs scene
        // code is modified from https://threejs.org/manual/#en/creating-a-scene
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const rectLight = new THREE.RectAreaLight(0xffffff, 5, 30, 10);
        rectLight.position.set(0, 0, 0);
        rectLight.lookAt(0, 0, 0);
        scene.add(rectLight);

        const renderer = new THREE.WebGLRenderer();
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.setAnimationLoop(animate);
        document.body.appendChild(renderer.domElement);
        const controls = new OrbitControls(camera, renderer.domElement);

        // load car model
        const loader = new GLTFLoader();
        loader.load("models/scene.gltf", (gltf) => {
            scene.add(gltf.scene);
            // create decal
            const mesh = scene.getObjectByName("Body_Body_0");
            console.log(mesh);
            if (!mesh) return;
            const p = new THREE.Vector3(0.9, 1.5, 1.2);
            const o = new THREE.Euler();
            const s = new THREE.Vector3(0.1, 0.1, 0.15);
            const decalGeo = new DecalGeometry(mesh as THREE.Mesh, p, o, s);
            const texLoader = new THREE.TextureLoader();
            const texture = texLoader.load(imgsrc);
            const material = new THREE.MeshBasicMaterial({map: texture, color: 0xffffff});
            const decal = new THREE.Mesh(decalGeo, material);
            decal.visible = true;
            scene.add(decal);
        });

        camera.position.z = 5;

        function animate( time: number ) {
            controls.update();
            console.log(camera.position);
            renderer.render( scene, camera );
        }
    }, []);

    return <></>
}