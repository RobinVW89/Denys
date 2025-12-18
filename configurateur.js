// ================================
// CONFIGURATEUR 3D - THREE.JS
// ================================

let scene, camera, renderer, house, roof, chimney, skylight, gutter;
let roofMaterial, wallMaterial;
let currentRoofType = 'gable';
let currentMaterial = 'tuiles';
let currentColor = '#8B4513';
let currentPitch = 35;

// Configuration
const config = {
    showChimney: false,
    showSkylight: false,
    showGutter: false
};

// ================================
// INITIALISATION
// ================================

function init3D() {
    const canvas = document.getElementById('canvas3d');
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // Scène
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe3f2fd);
    scene.fog = new THREE.Fog(0xe3f2fd, 50, 100);

    // Caméra
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(20, 15, 20);
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lumières
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(20, 30, 20);
    sunLight.castShadow = true;
    sunLight.shadow.camera.left = -20;
    sunLight.shadow.camera.right = 20;
    sunLight.shadow.camera.top = 20;
    sunLight.shadow.camera.bottom = -20;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);

    // Lumière d'appoint pour mieux voir les détails
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-15, 10, -15);
    scene.add(fillLight);

    // Sol
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x7cb342,
        roughness: 0.8
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grille
    const gridHelper = new THREE.GridHelper(50, 50, 0x888888, 0xcccccc);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Créer la maison
    createHouse();

    // Animation
    animate();

    // Resize
    window.addEventListener('resize', onWindowResize);
}

// ================================
// CRÉATION DE LA MAISON
// ================================

function createHouse() {
    // Groupe principal
    if (house) {
        scene.remove(house);
    }
    house = new THREE.Group();

    // Murs
    wallMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xfaf0e6,
        roughness: 0.7
    });

    const wallGeometry = new THREE.BoxGeometry(10, 5, 8);
    const walls = new THREE.Mesh(wallGeometry, wallMaterial);
    walls.position.y = 2.5;
    walls.castShadow = true;
    walls.receiveShadow = true;
    house.add(walls);

    // Créer le toit selon le type
    createRoof();

    scene.add(house);
}

// ================================
// CRÉATION DU TOIT
// ================================

function createRoof() {
    // Supprimer l'ancien toit
    if (roof) {
        house.remove(roof);
    }
    roof = new THREE.Group();

    // Matériau du toit - doit être créé AVANT les géométries
    updateRoofMaterial();

    const pitchRad = (currentPitch * Math.PI) / 180;
    const roofHeight = (5 * Math.tan(pitchRad)) / 2;

    // Vérifier que le matériau existe
    if (!roofMaterial) {
        console.error('Roof material not created!');
        roofMaterial = new THREE.MeshStandardMaterial({ color: currentColor });
    }

    switch (currentRoofType) {
        case 'gable':
            createGableRoof(roofHeight);
            break;
        case 'hip':
            createHipRoof(roofHeight);
            break;
        case 'flat':
            createFlatRoof();
            break;
    }

    house.add(roof);

    // Options
    updateOptions();
}

function createGableRoof(height) {
    // Pente gauche (côté -X)
    const leftVertices = new Float32Array([
        -5, 5, -4,     // 0: bas gauche avant
        0, 5 + height, -4,  // 1: sommet avant
        0, 5 + height, 4,   // 2: sommet arrière
        -5, 5, 4,      // 3: bas gauche arrière
    ]);
    const leftUvs = new Float32Array([
        0, 0,
        1, 0,
        1, 1,
        0, 1
    ]);
    const leftGeometry = new THREE.BufferGeometry();
    leftGeometry.setAttribute('position', new THREE.BufferAttribute(leftVertices, 3));
    leftGeometry.setAttribute('uv', new THREE.BufferAttribute(leftUvs, 2));
    leftGeometry.setIndex([0, 1, 2, 0, 2, 3]);
    leftGeometry.computeVertexNormals();
    
    const leftRoof = new THREE.Mesh(leftGeometry, roofMaterial);
    leftRoof.castShadow = true;
    leftRoof.receiveShadow = true;
    roof.add(leftRoof);

    // Pente droite (côté +X)
    const rightVertices = new Float32Array([
        0, 5 + height, -4,  // 0: sommet avant
        5, 5, -4,      // 1: bas droit avant
        5, 5, 4,       // 2: bas droit arrière
        0, 5 + height, 4,   // 3: sommet arrière
    ]);
    const rightUvs = new Float32Array([
        0, 0,
        1, 0,
        1, 1,
        0, 1
    ]);
    const rightGeometry = new THREE.BufferGeometry();
    rightGeometry.setAttribute('position', new THREE.BufferAttribute(rightVertices, 3));
    rightGeometry.setAttribute('uv', new THREE.BufferAttribute(rightUvs, 2));
    rightGeometry.setIndex([0, 1, 2, 0, 2, 3]);
    rightGeometry.computeVertexNormals();
    
    const rightRoof = new THREE.Mesh(rightGeometry, roofMaterial);
    rightRoof.castShadow = true;
    rightRoof.receiveShadow = true;
    roof.add(rightRoof);

    // Pignons (triangles aux extrémités)
    const pignonMaterial = new THREE.MeshStandardMaterial({ color: 0xfaf0e6 });
    
    // Pignon avant
    const frontPignonGeometry = new THREE.BufferGeometry();
    const frontPignonVertices = new Float32Array([
        -5, 5, -4,  5, 5, -4,  0, 5 + height, -4
    ]);
    frontPignonGeometry.setAttribute('position', new THREE.BufferAttribute(frontPignonVertices, 3));
    frontPignonGeometry.setIndex([0, 1, 2]);
    frontPignonGeometry.computeVertexNormals();
    const frontPignon = new THREE.Mesh(frontPignonGeometry, pignonMaterial);
    frontPignon.castShadow = true;
    roof.add(frontPignon);
    
    // Pignon arrière
    const backPignonGeometry = new THREE.BufferGeometry();
    const backPignonVertices = new Float32Array([
        -5, 5, 4,  0, 5 + height, 4,  5, 5, 4
    ]);
    backPignonGeometry.setAttribute('position', new THREE.BufferAttribute(backPignonVertices, 3));
    backPignonGeometry.setIndex([0, 1, 2]);
    backPignonGeometry.computeVertexNormals();
    const backPignon = new THREE.Mesh(backPignonGeometry, pignonMaterial);
    backPignon.castShadow = true;
    roof.add(backPignon);
}

function createHipRoof(height) {
    const vertices = new Float32Array([
        -5, 5, -4,    5, 5, -4,    5, 5, 4,    -5, 5, 4,
        -3, 5 + height, -2,    3, 5 + height, -2,
        3, 5 + height, 2,      -3, 5 + height, 2
    ]);

    const indices = [
        0, 1, 5,  0, 5, 4,
        1, 2, 6,  1, 6, 5,
        2, 3, 7,  2, 7, 6,
        3, 0, 4,  3, 4, 7,
        4, 5, 6,  4, 6, 7
    ];

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const roofMesh = new THREE.Mesh(geometry, roofMaterial);
    roofMesh.castShadow = true;
    roofMesh.receiveShadow = true;
    roof.add(roofMesh);
}

function createFlatRoof() {
    const geometry = new THREE.BoxGeometry(10.5, 0.3, 8.5);
    const roofMesh = new THREE.Mesh(geometry, roofMaterial);
    roofMesh.position.y = 5.15;
    roofMesh.castShadow = true;
    roofMesh.receiveShadow = true;
    roof.add(roofMesh);

    // Acrotère
    const acrotereGeometry = new THREE.BoxGeometry(11, 0.5, 0.3);
    const acrotereMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    
    [-4.4, 4.4].forEach(z => {
        const acrotere = new THREE.Mesh(acrotereGeometry, acrotereMaterial);
        acrotere.position.set(0, 5.55, z);
        acrotere.castShadow = true;
        roof.add(acrotere);
    });

    const acrotereGeometry2 = new THREE.BoxGeometry(0.3, 0.5, 8.5);
    [-5.4, 5.4].forEach(x => {
        const acrotere = new THREE.Mesh(acrotereGeometry2, acrotereMaterial);
        acrotere.position.set(x, 5.55, 0);
        acrotere.castShadow = true;
        roof.add(acrotere);
    });
}

// ================================
// MATÉRIAUX DU TOIT
// ================================

function updateRoofMaterial() {
    let roughness = 0.8;
    let metalness = 0;

    // Pour les toits plats, matériau uni sans texture complexe
    if (currentRoofType === 'flat') {
        roofMaterial = new THREE.MeshStandardMaterial({
            color: currentColor,
            roughness: 0.6,
            metalness: 0.1
        });
        return;
    }

    if (currentMaterial === 'zinc' || currentMaterial === 'bac-acier') {
        roughness = 0.3;
        metalness = 0.7;
    }

    // Créer un canvas pour la texture procédurale
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Dessiner la texture selon le matériau
    if (currentMaterial === 'tuiles') {
        // Texture tuiles - AVEC RELIEF TRÈS VISIBLE
        ctx.fillStyle = shadeColor(currentColor, -20);
        ctx.fillRect(0, 0, 1024, 1024);
        
        for (let y = 0; y < 1024; y += 50) {
            for (let x = 0; x < 1024; x += 75) {
                const offset = (y / 50) % 2 === 0 ? 0 : 37.5;
                
                // Base sombre de la tuile
                ctx.fillStyle = shadeColor(currentColor, -15);
                ctx.fillRect(x + offset, y, 73, 48);
                
                // Partie éclairée (relief)
                ctx.fillStyle = currentColor;
                ctx.fillRect(x + offset, y, 73, 35);
                
                // Ombre forte en bas (profondeur)
                ctx.fillStyle = shadeColor(currentColor, -40);
                ctx.fillRect(x + offset, y + 38, 73, 10);
                
                // Reflet en haut (volume)
                const gradient = ctx.createLinearGradient(x + offset, y, x + offset, y + 20);
                gradient.addColorStop(0, shadeColor(currentColor, 30));
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.fillRect(x + offset + 2, y + 2, 69, 15);
                
                // Bordures noires
                ctx.strokeStyle = shadeColor(currentColor, -50);
                ctx.lineWidth = 3;
                ctx.strokeRect(x + offset, y, 73, 48);
                
                // Ligne de séparation verticale
                ctx.beginPath();
                ctx.moveTo(x + offset + 36, y);
                ctx.lineTo(x + offset + 36, y + 48);
                ctx.strokeStyle = shadeColor(currentColor, -45);
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
        }
    } else if (currentMaterial === 'ardoises') {
        // Texture ardoises - AVEC RELIEF MARQUÉ
        ctx.fillStyle = shadeColor(currentColor, -25);
        ctx.fillRect(0, 0, 1024, 1024);
        
        for (let y = 0; y < 1024; y += 55) {
            for (let x = 0; x < 1024; x += 45) {
                const offset = (y / 55) % 2 === 0 ? 0 : 22.5;
                const variation = Math.random() * 12 - 6;
                
                // Base de l'ardoise
                ctx.fillStyle = shadeColor(currentColor, variation - 10);
                ctx.fillRect(x + offset, y, 44, 53);
                
                // Partie éclairée
                ctx.fillStyle = shadeColor(currentColor, variation + 5);
                ctx.fillRect(x + offset + 1, y + 1, 42, 40);
                
                // Ombre en bas (superposition)
                const shadowGradient = ctx.createLinearGradient(x + offset, y + 40, x + offset, y + 53);
                shadowGradient.addColorStop(0, 'transparent');
                shadowGradient.addColorStop(1, shadeColor(currentColor, -50));
                ctx.fillStyle = shadowGradient;
                ctx.fillRect(x + offset, y + 40, 44, 13);
                
                // Bordures très marquées
                ctx.strokeStyle = shadeColor(currentColor, -60);
                ctx.lineWidth = 3;
                ctx.strokeRect(x + offset, y, 44, 53);
                
                // Reflet léger
                if (Math.random() > 0.5) {
                    ctx.fillStyle = shadeColor(currentColor, variation + 25);
                    ctx.fillRect(x + offset + 3, y + 3, 15, 8);
                }
                
                // Lignes de relief
                ctx.strokeStyle = shadeColor(currentColor, -40);
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x + offset, y + 20);
                ctx.lineTo(x + offset + 44, y + 20);
                ctx.stroke();
            }
        }
    } else if (currentMaterial === 'zinc') {
        // Texture zinc - Métallique avec joints très visibles
        ctx.fillStyle = currentColor;
        ctx.fillRect(0, 0, 1024, 1024);
        
        // Bandes de zinc avec relief
        for (let i = 0; i < 1024; i += 150) {
            // Joint creux (ombre)
            ctx.fillStyle = shadeColor(currentColor, -35);
            ctx.fillRect(0, i - 5, 1024, 10);
            
            // Relief de la bande
            const bandGradient = ctx.createLinearGradient(0, i, 0, i + 150);
            bandGradient.addColorStop(0, shadeColor(currentColor, 25));
            bandGradient.addColorStop(0.5, currentColor);
            bandGradient.addColorStop(1, shadeColor(currentColor, -20));
            ctx.fillStyle = bandGradient;
            ctx.fillRect(0, i, 1024, 150);
            
            // Ligne de joint en relief
            ctx.strokeStyle = shadeColor(currentColor, -45);
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(1024, i);
            ctx.stroke();
        }
    } else if (currentMaterial === 'bac-acier') {
        // Texture bac acier - Ondulations TRÈS visibles
        ctx.fillStyle = shadeColor(currentColor, -10);
        ctx.fillRect(0, 0, 1024, 1024);
        
        for (let y = 0; y < 1024; y += 20) {
            const isRidge = y % 40 === 0; // Crête tous les 40px
            
            if (isRidge) {
                // Crête (partie haute) - très claire
                const ridgeGradient = ctx.createLinearGradient(0, y - 10, 0, y + 10);
                ridgeGradient.addColorStop(0, shadeColor(currentColor, -15));
                ridgeGradient.addColorStop(0.5, shadeColor(currentColor, 35));
                ridgeGradient.addColorStop(1, currentColor);
                ctx.fillStyle = ridgeGradient;
                ctx.fillRect(0, y - 10, 1024, 20);
                
                // Ligne de crête
                ctx.strokeStyle = shadeColor(currentColor, 45);
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(1024, y);
                ctx.stroke();
            } else {
                // Creux (partie basse) - sombre
                const valleyGradient = ctx.createLinearGradient(0, y - 10, 0, y + 10);
                valleyGradient.addColorStop(0, currentColor);
                valleyGradient.addColorStop(0.5, shadeColor(currentColor, -30));
                valleyGradient.addColorStop(1, shadeColor(currentColor, -10));
                ctx.fillStyle = valleyGradient;
                ctx.fillRect(0, y - 10, 1024, 20);
                
                // Ligne de creux
                ctx.strokeStyle = shadeColor(currentColor, -40);
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(1024, y);
                ctx.stroke();
            }
        }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    texture.needsUpdate = true;

    // Créer une normal map pour accentuer le relief
    const normalCanvas = document.createElement('canvas');
    normalCanvas.width = 512;
    normalCanvas.height = 512;
    const normalCtx = normalCanvas.getContext('2d');
    
    // Convertir la texture en données de hauteur pour la normal map
    normalCtx.fillStyle = '#8080ff'; // Couleur neutre pour normal map
    normalCtx.fillRect(0, 0, 512, 512);
    
    if (currentMaterial === 'tuiles' || currentMaterial === 'ardoises') {
        // Ajouter des variations de hauteur
        for (let y = 0; y < 512; y += 25) {
            for (let x = 0; x < 512; x += 35) {
                const offset = (y / 25) % 2 === 0 ? 0 : 17.5;
                // Relief vers le haut (bleu clair)
                normalCtx.fillStyle = '#a0a0ff';
                normalCtx.fillRect(x + offset, y, 33, 12);
                // Relief vers le bas (bleu foncé)
                normalCtx.fillStyle = '#6060ff';
                normalCtx.fillRect(x + offset, y + 12, 33, 10);
            }
        }
    } else if (currentMaterial === 'bac-acier') {
        // Ondulations
        for (let y = 0; y < 512; y += 10) {
            const isRidge = y % 20 === 0;
            normalCtx.fillStyle = isRidge ? '#c0c0ff' : '#4040ff';
            normalCtx.fillRect(0, y, 512, 10);
        }
    }
    
    const normalTexture = new THREE.CanvasTexture(normalCanvas);
    normalTexture.wrapS = THREE.RepeatWrapping;
    normalTexture.wrapT = THREE.RepeatWrapping;
    normalTexture.repeat.set(2, 2);
    normalTexture.needsUpdate = true;

    roofMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        normalMap: normalTexture,
        normalScale: new THREE.Vector2(0.5, 0.5),
        roughness: roughness,
        metalness: metalness,
        side: THREE.DoubleSide
    });
}

// Fonction helper pour modifier la teinte d'une couleur
function shadeColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, Math.max(0, (num >> 16) + amt));
    const G = Math.min(255, Math.max(0, (num >> 8 & 0x00FF) + amt));
    const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

// ================================
// OPTIONS (Cheminée, fenêtre, gouttières)
// ================================

function updateOptions() {
    // Cheminée
    if (chimney) {
        roof.remove(chimney);
    }
    if (config.showChimney) {
        chimney = createChimney();
        roof.add(chimney);
    }

    // Fenêtre de toit
    if (skylight) {
        roof.remove(skylight);
    }
    if (config.showSkylight) {
        skylight = createSkylight();
        roof.add(skylight);
    }

    // Gouttières
    if (gutter) {
        house.remove(gutter);
    }
    if (config.showGutter) {
        gutter = createGutters();
        house.add(gutter);
    }
}

function createChimney() {
    const group = new THREE.Group();
    const brickMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    
    const geometry = new THREE.BoxGeometry(1, 3, 1);
    const chimneyMesh = new THREE.Mesh(geometry, brickMaterial);
    chimneyMesh.position.set(2, 6.5, 1);
    chimneyMesh.castShadow = true;
    group.add(chimneyMesh);

    const capGeometry = new THREE.BoxGeometry(1.3, 0.3, 1.3);
    const capMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    const cap = new THREE.Mesh(capGeometry, capMaterial);
    cap.position.set(2, 8.15, 1);
    cap.castShadow = true;
    group.add(cap);

    return group;
}

function createSkylight() {
    const group = new THREE.Group();
    
    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const frameGeometry = new THREE.BoxGeometry(2, 0.1, 1.5);
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.set(-1, 6, 0);
    frame.rotation.x = -Math.PI / 6;
    frame.castShadow = true;
    group.add(frame);

    const glassMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x87ceeb,
        transparent: true,
        opacity: 0.4,
        metalness: 0.5,
        roughness: 0.1
    });
    const glassGeometry = new THREE.BoxGeometry(1.8, 0.05, 1.3);
    const glass = new THREE.Mesh(glassGeometry, glassMaterial);
    glass.position.set(-1, 6.05, 0);
    glass.rotation.x = -Math.PI / 6;
    group.add(glass);

    return group;
}

function createGutters() {
    const group = new THREE.Group();
    const gutterMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });

    // Gouttières horizontales
    const gutterGeometry = new THREE.CylinderGeometry(0.1, 0.1, 10.5, 8);
    
    [-4.2, 4.2].forEach(z => {
        const gutter = new THREE.Mesh(gutterGeometry, gutterMaterial);
        gutter.rotation.z = Math.PI / 2;
        gutter.position.set(0, 4.8, z);
        gutter.castShadow = true;
        group.add(gutter);
    });

    // Descentes
    const downpipeGeometry = new THREE.CylinderGeometry(0.08, 0.08, 5, 8);
    [[-5, -4], [5, -4], [-5, 4], [5, 4]].forEach(([x, z]) => {
        const downpipe = new THREE.Mesh(downpipeGeometry, gutterMaterial);
        downpipe.position.set(x, 2.5, z);
        downpipe.castShadow = true;
        group.add(downpipe);
    });

    return group;
}

// ================================
// CONTRÔLES DE CAMÉRA
// ================================

let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let cameraRotation = { theta: Math.PI / 4, phi: Math.PI / 6 };
let cameraDistance = 30;

function setupCameraControls() {
    const canvas = document.getElementById('canvas3d');

    canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaX = e.clientX - previousMousePosition.x;
            const deltaY = e.clientY - previousMousePosition.y;

            cameraRotation.theta += deltaX * 0.01;
            cameraRotation.phi += deltaY * 0.01;

            cameraRotation.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, cameraRotation.phi));

            updateCameraPosition();

            previousMousePosition = { x: e.clientX, y: e.clientY };
        }
    });

    canvas.addEventListener('mouseup', () => {
        isDragging = false;
    });

    canvas.addEventListener('mouseleave', () => {
        isDragging = false;
    });

    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        cameraDistance += e.deltaY * 0.05;
        cameraDistance = Math.max(10, Math.min(50, cameraDistance));
        updateCameraPosition();
    });
}

function updateCameraPosition() {
    const x = cameraDistance * Math.sin(cameraRotation.phi) * Math.cos(cameraRotation.theta);
    const y = cameraDistance * Math.cos(cameraRotation.phi);
    const z = cameraDistance * Math.sin(cameraRotation.phi) * Math.sin(cameraRotation.theta);

    camera.position.set(x, y, z);
    camera.lookAt(0, 3, 0);
}

// ================================
// VUES PRÉDÉFINIES
// ================================

function setView(viewType) {
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(viewType).classList.add('active');

    switch(viewType) {
        case 'viewFront':
            cameraRotation = { theta: 0, phi: Math.PI / 4 };
            cameraDistance = 25;
            break;
        case 'viewTop':
            cameraRotation = { theta: Math.PI / 4, phi: Math.PI / 8 };
            cameraDistance = 30;
            break;
        case 'viewSide':
            cameraRotation = { theta: Math.PI / 2, phi: Math.PI / 4 };
            cameraDistance = 25;
            break;
        case 'viewReset':
            cameraRotation = { theta: Math.PI / 4, phi: Math.PI / 6 };
            cameraDistance = 30;
            break;
    }
    updateCameraPosition();
}

// ================================
// ANIMATION
// ================================

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

function onWindowResize() {
    const canvas = document.getElementById('canvas3d');
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

// ================================
// GESTIONNAIRES D'ÉVÉNEMENTS
// ================================

function setupEventListeners() {
    // Type de toiture
    document.querySelectorAll('[data-type]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-type]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentRoofType = btn.dataset.type;
            createRoof();
        });
    });

    // Matériau
    document.querySelectorAll('[data-material]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-material]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMaterial = btn.dataset.material;
            createRoof();
        });
    });

    // Couleur
    document.querySelectorAll('[data-color]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-color]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentColor = btn.dataset.color;
            createRoof();
        });
    });

    // Pente
    const pitchSlider = document.getElementById('roofPitch');
    const pitchValue = document.getElementById('pitchValue');
    pitchSlider.addEventListener('input', () => {
        currentPitch = parseInt(pitchSlider.value);
        pitchValue.textContent = currentPitch;
        if (currentRoofType !== 'flat') {
            createRoof();
        }
    });

    // Options
    document.getElementById('chimney').addEventListener('change', (e) => {
        config.showChimney = e.target.checked;
        updateOptions();
    });

    document.getElementById('skylight').addEventListener('change', (e) => {
        config.showSkylight = e.target.checked;
        updateOptions();
    });

    document.getElementById('gutter').addEventListener('change', (e) => {
        config.showGutter = e.target.checked;
        updateOptions();
    });

    // Boutons
    document.getElementById('resetBtn').addEventListener('click', () => {
        currentRoofType = 'gable';
        currentMaterial = 'tuiles';
        currentColor = '#8B4513';
        currentPitch = 35;
        config.showChimney = false;
        config.showSkylight = false;
        config.showGutter = false;

        document.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector('[data-type="gable"]').classList.add('active');
        document.querySelector('[data-material="tuiles"]').classList.add('active');
        document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector('[data-color="#8B4513"]').classList.add('active');
        document.getElementById('roofPitch').value = 35;
        document.getElementById('pitchValue').textContent = 35;
        document.getElementById('chimney').checked = false;
        document.getElementById('skylight').checked = false;
        document.getElementById('gutter').checked = false;

        createRoof();
    });

    document.getElementById('contactBtn').addEventListener('click', () => {
        window.location.href = 'index.html#contact';
    });

    // Vues
    document.getElementById('viewFront').addEventListener('click', () => setView('viewFront'));
    document.getElementById('viewTop').addEventListener('click', () => setView('viewTop'));
    document.getElementById('viewSide').addEventListener('click', () => setView('viewSide'));
    document.getElementById('viewReset').addEventListener('click', () => setView('viewReset'));
}

// ================================
// INITIALISATION AU CHARGEMENT
// ================================

window.addEventListener('load', () => {
    init3D();
    setupCameraControls();
    setupEventListeners();
});
