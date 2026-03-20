"use client"

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DecalGeometry } from 'three/examples/jsm/Addons.js';
import { cameraPosition } from 'three/tsl';

interface ModelPreviewProps {
    imgsrc: string,
    carType: string,
    isTwoDoor?: boolean,
    leftSide?: boolean
}

const carTypes = ["small", "medium", "minivan", "suv", "large_van", "truck"];

export default function ModelPreview( {imgsrc, carType, isTwoDoor=false, leftSide=false}: ModelPreviewProps ) {
    const scene = useRef(new THREE.Scene());
    const carModels = useRef(new Map<string, THREE.Group>());
    const activeModel = useRef<null | THREE.Group>(null);
    const texLoader = useRef(new THREE.TextureLoader());
    const loader = useRef(new GLTFLoader());
    const stickerMat = useRef(new THREE.MeshBasicMaterial({color: 0xffffff, side: THREE.DoubleSide}));

    useEffect(() => {
        // setting up the threejs scene
        // code is modified from https://threejs.org/manual/#en/creating-a-scene
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const rectLight = new THREE.RectAreaLight(0xffffff, 20, 30, 10);
        rectLight.position.set(5, 5, 5);
        rectLight.lookAt(0, 0, 0);
        scene.current.add(rectLight);
        const rectLight2 = new THREE.RectAreaLight(0xffffff, 20, 30, 10);
        rectLight2.position.set(-5, 5, -5);
        rectLight2.lookAt(0, 0, 0);
        scene.current.add(rectLight2);

        const renderer = new THREE.WebGLRenderer();
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.setAnimationLoop(animate);
        document.body.appendChild(renderer.domElement);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enablePan = false;
        controls.enableDamping = true;

        swapTexture();
        swapModel();

        camera.position.x = 3;
        camera.position.y = 2;
        camera.position.z = 3;

        if (!leftSide) camera.position.x *= -1;

        function animate( time: number ) {
            controls.update();
            renderer.render( scene.current, camera );
        }
    }, []);

    // loads and returns modelName, modelName must be in carTypes
    async function getModel(modelName: string) {
        let car = "medium";
        if (carTypes.includes(modelName)) car = carType;

        if (!carModels.current.has(car)) {
            //load model
            const model = await loader.current.loadAsync("models/" + car + ".glb");
            carModels.current.set(car, model.scene);
        }
        return carModels.current.get(car);
    }

    function swapTexture() {
        const texture = texLoader.current.load(imgsrc);
        texture.colorSpace = THREE.SRGBColorSpace;
        stickerMat.current.map = texture;
    }

    async function swapModel() {
        //remove current model
        if (activeModel.current != null) {
            scene.current.remove(activeModel.current);
        }
        //add new model
        const model = await getModel(carType);
        if (!model) return;
        scene.current.add(model);
        activeModel.current = model;
        //display correct sticker position
        const sLeft = scene.current.getObjectByName("sLeft") as THREE.Mesh;
        sLeft.visible = false;
        const sRight = scene.current.getObjectByName("sRight") as THREE.Mesh;
        sRight.visible = false;
        const dsLeft = scene.current.getObjectByName("dsLeft") as THREE.Mesh;
        dsLeft.visible = false;
        const dsRight = scene.current.getObjectByName("dsRight") as THREE.Mesh;
        dsRight.visible = false;

        let stickerName = "";

        if (isTwoDoor && leftSide) {
            stickerName = "dsLeft"
        }
        else if (isTwoDoor && !leftSide) {
            stickerName = "dsRight"
        }
        else if (!isTwoDoor && leftSide) {
            stickerName = "sLeft"
        }
        else {
            stickerName = "sRight"
        }

        const sticker = scene.current.getObjectByName(stickerName) as THREE.Mesh;
        sticker.material = stickerMat.current;
        sticker.visible = true;
    }

    return <></>
}