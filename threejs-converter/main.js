let scene, camera, renderer, controls;

init();
loadDataAndRenderBuildings();
animate();

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xf0f0f0); // Set background color

    document.body.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.minDistance = 80;  // Minimum zoom distance (e.g., 50 units from the target)
    controls.maxDistance = 700; // Maximum zoom distance (e.g., 1000 units from the target)



}

async function fetchJsonData(url) {
    const response = await fetch(url);
    return await response.json();
}

function createGeometryFromPolygon(points, extrusionHeight) {
    const shapePoints = points.map(point => new THREE.Vector2(point.x, point.y));
    const shape = new THREE.Shape(shapePoints);
    const extrudeSettings = {
        depth: extrusionHeight,
        bevelEnabled: false,
        bevelSize: 0,
        bevelOffset: 0,
        bevelSegments: 1
    };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

    // Rotate the geometry to align with the XY plane
    geometry.rotateX(-Math.PI / 2);

    geometry.scale(1, 1, -1);


    return geometry;
}



let sceneBoundingBox;

async function loadDataAndRenderBuildings() {
    const data = await fetchJsonData('prediction-t1-cropped-conf20-v1.json');

    // Scale factor: Assuming each pixel at zoom level 19 is 0.3 meters in real life
    const scale = 0.3;

    // Convert data to local coordinates
    const buildings = data.predictions.map(prediction => {
        return {
            x: prediction.x * scale,
            y: prediction.y * scale,
            points: prediction.points.map(point => ({
                x: point.x * scale,
                y: point.y * scale
            }))
        };
    });


    buildings.forEach(building => {
        // Simplify the building's points
        const epsilon = 1; // Adjust this value based on your needs
        const simplifiedPoints = simplifyPath(building.points, epsilon);

        const height = Math.random() * 2 + 4;  // As per your request, adjusted the height
        const geometry = createGeometryFromPolygon(simplifiedPoints, height);


        const material = new THREE.MeshBasicMaterial({ color: 0xff7a7f, side: THREE.DoubleSide });
        material.depthWrite = true;
        const mesh = new THREE.Mesh(geometry, material);

        // 1. Create an edges geometry from your original geometry.
        const edgesGeometry = new THREE.EdgesGeometry(mesh.geometry);

        // 2. Create a line material.
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });

        // 3. Create a line segment mesh using the edges geometry and line material.
        const lineSegments = new THREE.LineSegments(edgesGeometry, lineMaterial);

        // 4. Add the line segment mesh to your scene.
        scene.add(lineSegments);

        scene.add(mesh);
    });

    // Compute the bounding box of the scene after adding buildings
    sceneBoundingBox = new THREE.Box3().setFromObject(scene);
    const center = new THREE.Vector3();
    sceneBoundingBox.getCenter(center);
    const size = new THREE.Vector3();
    sceneBoundingBox.getSize(size);

    // Adjust ground geometry to cover the bounding box
    const groundSize = Math.max(size.x, size.z) * 1.1; // 1.1 as a margin factor, you can adjust as needed
    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
    const groundMaterial = new THREE.MeshBasicMaterial({ color: 0xbababa, side: THREE.DoubleSide });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = Math.PI / 2; // Rotate to lay flat
    ground.position.set(center.x, -0.3, center.z); // Adjust ground's position
    scene.add(ground);

    adjustCameraToScene();
}


function adjustCameraToScene() {
    // Use the already computed sceneBoundingBox

    const center = new THREE.Vector3();
    sceneBoundingBox.getCenter(center);
    const size = new THREE.Vector3();
    sceneBoundingBox.getSize(size);

    // Adjust the camera's position to be above the center of the scene's bounding box and look down at it.
    camera.position.set(center.x, center.y + size.length() * 1, center.z);
    camera.lookAt(center);
    controls.target = center;

    const axesHelper = new THREE.AxesHelper(500); // Length of the arrows for the axes
    scene.add(axesHelper);

}



function animate() {
    requestAnimationFrame(animate);
    controls.update();

    renderer.render(scene, camera);
}

function simplifyPath(points, epsilon) {
    // Find the point with the maximum distance
    let dmax = 0;
    let index = 0;
    const start = points[0];
    const end = points[points.length - 1];

    for (let i = 1; i < points.length - 1; i++) {
        const d = perpendicularDistance(points[i], start, end);
        if (d > dmax) {
            index = i;
            dmax = d;
        }
    }

    // If max distance is greater than epsilon, recursively simplify
    let results = [];
    if (dmax > epsilon) {
        const recResults1 = simplifyPath(points.slice(0, index + 1), epsilon);
        const recResults2 = simplifyPath(points.slice(index), epsilon);

        results = recResults1.slice(0, recResults1.length - 1).concat(recResults2);
    } else {
        results = [start, end];
    }

    return results;
}

function perpendicularDistance(point, lineStart, lineEnd) {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    const abs = Math.sqrt(dx * dx + dy * dy);
    const num = Math.abs(dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x);

    return num / abs;
}


// In Three.js, the colors of the axes in the AxesHelper are as follows:
//     X-axis: Red
//     Y-axis: Green
//     Z-axis: Blue
