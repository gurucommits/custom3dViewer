jQuery(document).ready(function ($) {
    /**
     * Hide Modal
     */
    $(".close", "#View3DModal").click(function () {
        document.getElementById('View3DModal').classList.add("hide");
        /**
         * 
         * remove Modal Content
         */
        const modalBody = document.getElementById('modelContainer');
        modalBody.innerHTML = "";
        document.querySelector("#View3DModal .loadingScreen").style.display = "none";
        document.querySelector("#View3DModal .animationController").style.display = "none";
    });
    document.getElementById("confirmDecodeYes").addEventListener('click', downloadDecodeFile);
    document.getElementById("confirmDecodeNo").addEventListener('click', downloadOriginalFile);
    var encodedfileUrl = '', Gurlarray = [];
    // loadedMeshes = {}, cameras = {};
});

var loadedMeshes = {}, meshPlay, cameras = {};

function playMesh(url) {
    var playButtonStatus = document.querySelector('div[data-url="'+ url +'"] .animationController .meshPlayBtn');
    let slider = document.querySelector('div[data-url="'+ url +'"] .animationController .animateSlider');
    playButtonStatus.classList.toggle('active');
    clearInterval(meshPlay);
    meshPlay = null;
    if(playButtonStatus.classList.contains('active')) {
        if(slider.value == slider.max) {
            slider.value = 0;
        }
        meshPlay = setInterval(function() {
            slider.value++;
            if(Number(slider.value) >= Number(slider.max)){
                playButtonStatus.classList.remove('active');
                clearInterval(meshPlay);
                meshPlay = null;
            }
            changeMesh(url)
        }, 400)
    }
}

function open3DModelDialog(url) {
    document.getElementById('View3DModal').classList.remove("hide");
    const baseUrl = `${window.location.protocol}//${window.location.host}/`;
    const modalBody = document.getElementById('modelContainer');
    modalBody.parentElement.setAttribute("data-url", url);
    // Check for the existence of necessary elements
    if (!modalBody) {
        return;
    }
    modalBody.style.height = modalBody.clientWidth / 16 * 9 + "px";
    // Clear any previous content
    modalBody.innerHTML = "";
    /**
     * 
     * @param {*} imageUrl 
     * @returns 3D Model Viewer
     */

    view3DModelR(url, modalBody)
    document.querySelector("#View3DModal .up-btn").setAttribute('onclick', 'changeMesh("'+url+'", event)')
    document.querySelector("#View3DModal .lo-btn").setAttribute('onclick', 'changeMesh("'+url+'", event)')
    document.querySelector("#View3DModal .meshPlayBtn").setAttribute('onclick', 'playMesh("'+url+'", event)')
    document.querySelector("#View3DModal .animateSlider").setAttribute('oninput', 'changeMesh("'+url+'")')
}

function changeMesh(url, event) {
    if(event != undefined)
        event.target.classList.toggle('active');
    const meshToChange = loadedMeshes[url]
    let buttonCheck = 0;
    if(document.querySelector('div[data-url="'+ url +'"] .animationController .up-btn').classList.contains('active')) {
        buttonCheck += 2;
    }
    if(document.querySelector('div[data-url="'+ url +'"] .animationController .lo-btn').classList.contains('active')) {
        buttonCheck += 1;
    }
    let meshnumber = document.querySelector('div[data-url="'+ url +'"] .animationController .animateSlider').value;
    for (const [filename, mesh] of Object.entries(meshToChange)) {
        mesh.visible = false;
        if(Number(filename.replace(/\D/g, "")) == meshnumber){
            if(buttonCheck == 3) {
                mesh.visible = true;
            } else if (buttonCheck == 2 && filename.includes("upper")) {
                mesh.visible = true;
            } else if(buttonCheck == 1 && filename.includes("lower")) {
                mesh.visible = true;
            }
        }
            
    }
    document.querySelector('div[data-url="'+ url +'"] .animationController .currentStep').innerHTML = Number(meshnumber) + 1;
}

function downloadModel(url) {
    Gurlarray = url.split("/")
    if(url.slice(-1) == "x") {
        document.getElementById('rDecodeconfirmModal').classList.remove("hide");
        document.getElementById('rDecodeconfirmModal').classList.add("show");
        encodedfileUrl = url;
    } else {
        const aElem = document.createElement('a');
        aElem.href = url;
        aElem.download = Gurlarray[Gurlarray.length - 1];
        aElem.click();
    }
}

function downloadDecodeFile() {
    const dracoLoaderForDownload = new DRACOLoader();
    dracoLoaderForDownload.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    dracoLoaderForDownload.setDecoderConfig({ type: 'js' });

    dracoLoaderForDownload.load(encodedfileUrl, function(geometry) {
        let material
        if (geometry.attributes.color) {
            material = new MeshStandardMaterial({ vertexColors: true });
        } else {
            material = new MeshStandardMaterial({ color: 0xdddddd });
        }
        const mesh = new Mesh(geometry, material);
        let exporter;
        if(encodedfileUrl.slice(-4, -1) == 'ply') {
            exporter = new PLYExporter();
        } else {
            exporter = new STLExporter();
        }
        const objData = exporter.parse(mesh, {binary: false});
        
        const blob = new Blob([objData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const aEl = document.createElement('a');
        aEl.href = url;
        aEl.download = (Gurlarray[Gurlarray.length - 1]).slice(0, -1);
        aEl.click();
        document.getElementById('rDecodeconfirmModal').classList.remove("show");
        document.getElementById('rDecodeconfirmModal').classList.add("hide");
    })
}

function downloadOriginalFile() {
    const aElem = document.createElement('a');
    aElem.href = encodedfileUrl;
    aElem.download = Gurlarray[Gurlarray.length - 1];
    aElem.click();
    document.getElementById('rDecodeconfirmModal').classList.remove("show");
    document.getElementById('rDecodeconfirmModal').classList.add("hide");
}

function view3DModelR(url, container) {
    const fileBuffers = {};
    let camera, scene, renderer, controls, Gloader;
    
    const stlLoader = new STLLoader();
    const plyLoader = new PLYLoader();
    // Configure and create Draco decoder.
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    dracoLoader.setDecoderConfig({ type: 'js' });

    let extension = url.slice(-3);
    if(extension == "ply") {
        Gloader = plyLoader;
    } else if (extension == "stl"){
        Gloader = stlLoader;
    } else {
        Gloader = dracoLoader;
    }

    camera = new OrthographicCamera( container.clientWidth / -10, container.clientWidth / 10, container.clientHeight / 10, container.clientHeight / -10, -500, 1000);
    // camera = new PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    scene = new Scene();
    scene.background = new Color(0xffffff);

    // Lights
    if (extension == "stl") {
        const keyLight = new DirectionalLight(0xffffff, 2.5);
        keyLight.position.set(-10, 10, 35);
        scene.add(keyLight);

        const fillLight = new DirectionalLight(0xffffff, 2.5);
        fillLight.position.set(20, 10, 25);
        scene.add(fillLight);

        const backLight = new DirectionalLight(0xffffff, 3.5);
        backLight.position.set(2, -65, 30);
        scene.add(backLight);

        const ambientLight = new AmbientLight(0x85E5FF, 0.2);
        scene.add(ambientLight);

        const dbackLight12 = new DirectionalLight(0xffffff, 2.5);
        dbackLight12.position.set(-30, 10, -35);
        scene.add(dbackLight12);

        const dbackLight2 = new DirectionalLight(0xffffff, 2.5);
        dbackLight2.position.set(30, 10, -35);
        scene.add(dbackLight2);

    } else {

        const keyLight = new DirectionalLight(0xffffff, 1.5);
        keyLight.position.set(0, 0, 70);
        scene.add(keyLight);
    
        const backLight3 = new DirectionalLight(0xffffff, 1.5);
        backLight3.position.set(0, -100, 30);
        scene.add(backLight3);
    
        const backLight4 = new DirectionalLight(0xffffff, 1.5);
        backLight4.position.set(200, -100, 30);
        scene.add(backLight4);
    
        const backLight = new DirectionalLight(0xffffff, 1.5);
        backLight.position.set(-200, -100, 30);
        scene.add(backLight);
    
        const backLight2 = new DirectionalLight(0xffffff, 1.5);
        backLight2.position.set(0, 100, -30);
        scene.add(backLight2);
    
        const dbackLight12 = new DirectionalLight(0xffffff, 1.5);
        dbackLight12.position.set(0, 0, -30);
        scene.add(dbackLight12);
        
        const ambientLight = new AmbientLight(0x85E5FF, 0.2);
        scene.add(ambientLight);
    }

    async function fetchAndUnzip(url) {
        try {
            // Fetch the ZIP file from the server
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
            }

            // Get the array buffer from the response
            const arrayBuffer = await response.arrayBuffer();

            // Initialize JSZip
            const zip = new JSZip();

            // Load the array buffer into JSZip
            const contents = await zip.loadAsync(arrayBuffer);

            // Loop through the files in the ZIP
            for (const filename of Object.keys(contents.files)) {
                const file = contents.files[filename];

                // If it's not a directory, get its buffer
                if (!file.dir) {
                    const buffer = await file.async("arraybuffer");
                    fileBuffers[filename] = buffer;
                }

            }

        } catch (error) {
            console.error("An error occurred:", error);
        }
    }

    if(extension == "pac") {
        document.querySelector('div[data-url="'+ url +'"] .loadingScreen').style.display = "flex";
        
        fetchAndUnzip(url)
		.then((result) => {
            loadedMeshes[url] = {}
            const entries = Object.entries(fileBuffers);
            for (const [index, [filename, buffer]] of entries.entries()) {
                (async () => {
                    try {
                        const geometry = await new Promise((resolve, reject) => {
                            Gloader.parse(buffer, (parsedGeometry) => {
                                parsedGeometry.computeVertexNormals();
                                resolve(parsedGeometry);
                            });
                        });
            
                        let material;
                        if (geometry.attributes.color) {
                            material = new MeshPhongMaterial({ vertexColors: true, side: DoubleSide });
                        } else {
                            material = new MeshPhongMaterial({ color: 0x7DCBFA, side: DoubleSide });
                        }
            
                        material.reflectivity = 0.7; // Example value for reflectivity

                        // Adding specular highlights
                        material.shininess = 10; // value for shininess
                        material.flatShading = false;
                        material.needsUpdate = true;

                        const mesh = new Mesh(geometry, material);
            
                        geometry.computeBoundingBox();
                        const bbox = geometry.boundingBox;
                        const center = bbox.getCenter(new Vector3());
                        mesh.position.sub(center);
                        mesh.castShadow = true;
                        const height = bbox.max.z - bbox.min.z;
                        
                        let spacing = 2;
                        if (filename.includes("upper")) {
                            mesh.position.z = mesh.position.z + height / 2 - spacing;
                        } else {
                            mesh.position.z = mesh.position.z - height / 2 + spacing;
                        }
            
                        scene.add(mesh);
                        if(filename.replace(/\D/g, "") == 0) {
                            mesh.visible = true;
                        } else {
                            mesh.visible = false;
                        }
                        loadedMeshes[url][filename] = mesh;
                        if (index === entries.length - 1) {
                            //Load Complete Action
                            document.querySelector('div[data-url="'+ url +'"] .animationController').style.display = "block";
                            document.querySelector('div[data-url="'+ url +'"] .loadingScreen').style.display = "none";
                        }
                    } catch (error) {
                        console.error("Error parsing geometry for file:", filename, "Error:", error);
                        return;
                    }
                })();
            }
            
            const mesheslength = Object.keys(fileBuffers).length;
            document.querySelector('div[data-url="'+ url +'"] .animationController .animateSlider').max = Math.floor(mesheslength / 2 - 1);
            document.querySelector('div[data-url="'+ url +'"] .animationController .animateSlider').value = 0;
            document.querySelector('div[data-url="'+ url +'"] .animationController .maxStep').innerHTML = Math.floor(mesheslength / 2 );
            document.querySelector('div[data-url="'+ url +'"] .animationController .currentStep').innerHTML = 1;

		})
        .catch (error => {

            return;
        })
    } else {
        Gloader.load(url, function (geometry) {
            geometry.computeVertexNormals();
            let material
            if(extension == "stl") {
                material = new MeshPhongMaterial({ color: 0x2E75B6, side: DoubleSide});
                material.specular = new Color(0x2E75B6);
            }else if (geometry.attributes.color) {
                material = new MeshPhongMaterial({ vertexColors: true, side: DoubleSide });
            } else {
                material = new MeshPhongMaterial({ color: 0x2E75B6, side: DoubleSide });
            }

            // Adjusting environment light
            if(extension == "stl"){
                material.specular = new Color(0x3382C9);
                material.shininess = 5;
            }
			material.reflectivity = 0.1;
			material.metalness = 0;
			material.roughness = 0;
            // material.IOR = 1.2;
            material.flatShading = false;
            // material.needsUpdate = true;
    
            const mesh = new Mesh(geometry, material);
            geometry.computeBoundingBox();
            const bbox = geometry.boundingBox;
            const center = bbox.getCenter(new Vector3());
            mesh.position.sub(center);
            if( extension == 'ply') {
                const box = new Box3().setFromObject(mesh);
                mesh.rotation.z += Math.PI;
                const center = box.getCenter(new Vector3());
                mesh.position.sub(center);
            }
			mesh.castShadow = true;
            scene.add(mesh);
        });
    }

    // renderer
    renderer = new WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth-4, container.clientHeight);		//Indicate parent div width and height
    renderer.setAnimationLoop(animate);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Add Arcball controls
    controls = new ArcballControls(camera, renderer.domElement, scene);
    controls.setGizmosVisible(false); // Optional: Show control gizmos

    controls.enableZoom = true;
    controls.zoomSpeed = 1.2;
    controls.minZoom = 0.5;
    controls.maxZoom = 5;

    controls.target.set( 0, 0, 0 );
    camera.position.set(0, -70, 50);
    controls.update();

    let initialDistance = null;
    let initialZoom = camera.zoom;

    window.addEventListener('touchmove', function(event) {
        if (event.touches.length === 2) {
            const dx = event.touches[0].pageX - event.touches[1].pageX;
            const dy = event.touches[0].pageY - event.touches[1].pageY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (initialDistance) {
                const zoomFactor = distance / initialDistance;
                camera.zoom = Math.min(Math.max(initialZoom * zoomFactor, controls.minZoom), controls.maxZoom);
                camera.updateProjectionMatrix();
            } else {
                initialDistance = distance;
                initialZoom = camera.zoom;
            }
        }
    }, false);
    
    window.addEventListener('touchend', function(event) {
        if (event.touches.length < 2) {
            initialDistance = null;
            initialZoom = camera.zoom;
        }
    }, false);


    cameras[url] = camera


    window.addEventListener('resize', onWindowResize);

    function onWindowResize() {

        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(container.clientWidth, container.clientHeight);

    }

    function animate() {
        const timer = Date.now() * 0.0003;
        renderer.render(scene, camera);

    }
}

function setCameraPosition(event) {
    var target = event.target;
    var cameraController = cameras[target.parentElement.parentElement.getAttribute('data-url')];
    switch (target.classList[0]) {
        case 'rightbtn':
            cameraController.position.set(-70, 0, 0);
            cameraController.up.set(0, 0, 1);
            break;
        case 'leftbtn':
            cameraController.position.set(70, 0, 0);
            cameraController.up.set(0, 0, 1);
            break;
        case 'frbtn':
            cameraController.position.set(0, -70, 0);
            cameraController.up.set(0, 0, 1);
            break;
        case 'upbtn':
            cameraController.position.set(0, 0, -70);
            cameraController.up.set(0, -1, 0);
            break;
        case 'downbtn':
            cameraController.position.set(0, 0, 70);
            cameraController.up.set(0, 1, 0);
            break;
        default:
            break;
    }

    cameraController.lookAt(0, 0, 0);

}