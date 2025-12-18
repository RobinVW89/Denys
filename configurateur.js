// ================================
// CONFIGURATEUR 3D - THREE.JS
// ================================

let scene, camera, renderer, house, roof, chimney, skylight, gutter, solarPanels;
let roofMaterial, wallMaterial;
let currentRoofType = 'gable';
let currentMaterial = 'tuiles';
let currentColor = '#8B4513';
let currentPitch = 35;

// Configuration
const config = {
    showChimney: false,
    showSkylight: false,
    showGutter: false,
    showSolarPanels: false
};

// Palettes de couleurs par matériau
const colorPalettes = {
    tuiles: [
        { color: '#8B4513', name: 'Rouge terre cuite' },
        { color: '#CD5C5C', name: 'Rouge vif' },
        { color: '#A0522D', name: 'Brun terracotta' },
        { color: '#8B4726', name: 'Brun foncé' },
        { color: '#D2691E', name: 'Orange brûlé' }
    ],
    ardoises: [
        { color: '#2F4F4F', name: 'Gris anthracite' },
        { color: '#1C1C1C', name: 'Noir ardoise' },
        { color: '#696969', name: 'Gris foncé' },
        { color: '#708090', name: 'Gris ardoise clair' },
        { color: '#36454F', name: 'Gris charbon' }
    ],
    zinc: [
        { color: '#C0C0C0', name: 'Zinc naturel' },
        { color: '#A9A9A9', name: 'Gris argenté' },
        { color: '#8B8B83', name: 'Zinc patiné' },
        { color: '#D3D3D3', name: 'Gris clair' }
    ],
    'bac-acier': [
        { color: '#696969', name: 'Gris anthracite' },
        { color: '#8B8B83', name: 'Beige' },
        { color: '#8B4513', name: 'Brun' },
        { color: '#2F4F4F', name: 'Gris foncé' },
        { color: '#C0C0C0', name: 'Gris clair' },
        { color: '#1C1C1C', name: 'Noir' }
    ]
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
    scene.background = new THREE.Color(0x1a2530);
    scene.fog = new THREE.Fog(0x1a2530, 50, 100);

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
        color: 0x2a3f4f,
        roughness: 0.9,
        metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grille premium
    const gridHelper = new THREE.GridHelper(50, 50, 0xb87333, 0x34495e);
    gridHelper.position.y = 0;
    gridHelper.material.opacity = 0.3;
    gridHelper.material.transparent = true;
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
    if (config.showChimney && currentRoofType !== 'flat') {
        chimney = createChimney();
        roof.add(chimney);
    }

    // Fenêtre de toit
    if (skylight) {
        roof.remove(skylight);
    }
    if (config.showSkylight && currentRoofType !== 'flat') {
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

    // Panneaux solaires
    if (solarPanels) {
        roof.remove(solarPanels);
    }
    if (config.showSolarPanels && currentRoofType !== 'flat') {
        solarPanels = createSolarPanels();
        roof.add(solarPanels);
    }
}

function createChimney() {
    const group = new THREE.Group();
    const brickMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8B4513,
        roughness: 0.9
    });
    
    const pitchRad = (currentPitch * Math.PI) / 180;
    const roofHeight = (5 * Math.tan(pitchRad)) / 2;
    
    const geometry = new THREE.BoxGeometry(1, 3.5, 1);
    const chimneyMesh = new THREE.Mesh(geometry, brickMaterial);
    // Position adaptée à la pente
    chimneyMesh.position.set(-3, 5 + roofHeight * 0.6 + 1.75, 0);
    chimneyMesh.castShadow = true;
    group.add(chimneyMesh);

    const capGeometry = new THREE.BoxGeometry(1.3, 0.3, 1.3);
    const capMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    const cap = new THREE.Mesh(capGeometry, capMaterial);
    cap.position.set(-3, 5 + roofHeight * 0.6 + 3.65, 0);
    cap.castShadow = true;
    group.add(cap);

    return group;
}

function createSkylight() {
    const group = new THREE.Group();
    
    const pitchRad = (currentPitch * Math.PI) / 180;
    const roofHeight = (5 * Math.tan(pitchRad)) / 2;
    const angle = -pitchRad;
    
    // Cadre du Velux
    const frameMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x2c2c2c,
        metalness: 0.3,
        roughness: 0.7
    });
    const frameGeometry = new THREE.BoxGeometry(1.2, 0.12, 1.8);
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    
    // Position sur le toit côté droit
    const xPos = 1.5;
    const yPos = 5 + roofHeight * 0.3 + 0.1;
    const zPos = -1;
    
    frame.position.set(xPos, yPos, zPos);
    frame.rotation.x = angle;
    frame.castShadow = true;
    group.add(frame);

    // Vitre
    const glassMaterial = new THREE.MeshPhysicalMaterial({ 
        color: 0x87ceeb,
        transparent: true,
        opacity: 0.3,
        metalness: 0.1,
        roughness: 0.1,
        transmission: 0.9,
        thickness: 0.5
    });
    const glassGeometry = new THREE.BoxGeometry(1.1, 0.05, 1.7);
    const glass = new THREE.Mesh(glassGeometry, glassMaterial);
    glass.position.set(xPos, yPos + 0.08, zPos);
    glass.rotation.x = angle;
    group.add(glass);

    return group;
}

function createSolarPanels() {
    const group = new THREE.Group();
    
    const pitchRad = (currentPitch * Math.PI) / 180;
    const roofHeight = (5 * Math.tan(pitchRad)) / 2;
    const angle = -pitchRad;
    
    // Matériau des panneaux
    const panelMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x1a1a2e,
        metalness: 0.6,
        roughness: 0.3
    });
    
    // Créer 6 panneaux (2x3)
    for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 3; col++) {
            const panelGeometry = new THREE.BoxGeometry(1.2, 0.08, 1.8);
            const panel = new THREE.Mesh(panelGeometry, panelMaterial);
            
            const xPos = -2.5 + col * 1.3;
            const yPos = 5 + roofHeight * 0.5 + 0.15;
            const zPos = -2 + row * 1.9;
            
            panel.position.set(xPos, yPos, zPos);
            panel.rotation.x = angle;
            panel.castShadow = true;
            group.add(panel);
            
            // Reflet sur le panneau
            const reflectGeometry = new THREE.BoxGeometry(1.1, 0.02, 1.7);
            const reflectMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x4a90e2,
                metalness: 0.9,
                roughness: 0.1,
                emissive: 0x1a3a5a,
                emissiveIntensity: 0.2
            });
            const reflect = new THREE.Mesh(reflectGeometry, reflectMaterial);
            reflect.position.set(xPos, yPos + 0.05, zPos);
            reflect.rotation.x = angle;
            group.add(reflect);
        }
    }

    return group;
}

function createGutters() {
    const group = new THREE.Group();
    // Gouttières en cuivre
    const gutterMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xB87333,
        metalness: 0.7,
        roughness: 0.3
    });

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

// Fonction pour mettre à jour les couleurs disponibles
function updateColorPalette() {
    const colorSelector = document.getElementById('colorSelector');
    colorSelector.innerHTML = '';
    
    const colors = colorPalettes[currentMaterial];
    colors.forEach((colorData, index) => {
        const btn = document.createElement('button');
        btn.className = 'color-btn';
        if (index === 0 || colorData.color === currentColor) {
            btn.classList.add('active');
            currentColor = colorData.color;
        }
        btn.setAttribute('data-color', colorData.color);
        btn.setAttribute('title', colorData.name);
        btn.style.backgroundColor = colorData.color;
        
        btn.addEventListener('click', () => {
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentColor = colorData.color;
            createRoof();
        });
        
        colorSelector.appendChild(btn);
    });
}

function setupEventListeners() {
    // Type de toiture
    document.querySelectorAll('[data-type]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-type]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentRoofType = btn.dataset.type;
            
            // Masquer certaines options si toit plat
            const pitchGroup = document.querySelector('#roofPitch').closest('.control-group');
            if (currentRoofType === 'flat') {
                pitchGroup.style.opacity = '0.5';
                pitchGroup.style.pointerEvents = 'none';
            } else {
                pitchGroup.style.opacity = '1';
                pitchGroup.style.pointerEvents = 'auto';
            }
            
            createRoof();
        });
    });

    // Matériau
    document.querySelectorAll('[data-material]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-material]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMaterial = btn.dataset.material;
            updateColorPalette();
            createRoof();
        });
    });

    // Initialiser la palette de couleurs
    updateColorPalette();

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

    document.getElementById('solarPanels').addEventListener('change', (e) => {
        config.showSolarPanels = e.target.checked;
        updateOptions();
    });

    // Bouton Sauvegarder
    document.getElementById('saveBtn').addEventListener('click', () => {
        saveConfiguration();
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
        config.showSolarPanels = false;

        document.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector('[data-type="gable"]').classList.add('active');
        document.querySelector('[data-material="tuiles"]').classList.add('active');
        document.getElementById('roofPitch').value = 35;
        document.getElementById('pitchValue').textContent = 35;
        document.getElementById('chimney').checked = false;
        document.getElementById('skylight').checked = false;
        document.getElementById('gutter').checked = false;
        document.getElementById('solarPanels').checked = false;

        updateColorPalette();
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
// SAUVEGARDE DE LA CONFIGURATION
// ================================

function saveConfiguration() {
    // Obtenir les noms des matériaux
    const materialNames = {
        tuiles: 'Tuiles en terre cuite',
        ardoises: 'Ardoises naturelles',
        zinc: 'Zinc',
        'bac-acier': 'Bac acier'
    };
    
    const roofTypes = {
        gable: 'Toiture à deux pentes',
        hip: 'Toiture à quatre pentes',
        flat: 'Toiture plate'
    };
    
    // Obtenir la couleur sélectionnée
    const colorName = document.querySelector('.color-btn.active')?.title || 'Non définie';
    
    // Obtenir les options de qualité
    const isolation = document.getElementById('insulation').options[document.getElementById('insulation').selectedIndex].text;
    const warranty = document.getElementById('warranty').options[document.getElementById('warranty').selectedIndex].text;
    const finish = document.getElementById('finish').options[document.getElementById('finish').selectedIndex].text;
    
    // Créer l'objet de configuration
    const configuration = {
        date: new Date().toLocaleDateString('fr-FR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }),
        toiture: {
            type: roofTypes[currentRoofType],
            materiau: materialNames[currentMaterial],
            couleur: colorName,
            pente: currentRoofType !== 'flat' ? `${currentPitch}°` : 'N/A'
        },
        elements: {
            cheminee: config.showChimney ? 'Oui' : 'Non',
            fenetreToit: config.showSkylight ? 'Oui' : 'Non',
            gouttieres: config.showGutter ? 'Oui' : 'Non',
            panneauxSolaires: config.showSolarPanels ? 'Oui' : 'Non'
        },
        qualite: {
            isolation: isolation,
            garantie: warranty,
            finition: finish
        }
    };
    
    // 1. Sauvegarder l'image 3D
    const canvas = document.getElementById('canvas3d');
    canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `toiture-3d-${Date.now()}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    });
    
    // 2. Sauvegarder le fichier de configuration JSON
    const configJSON = JSON.stringify(configuration, null, 2);
    const blob = new Blob([configJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `configuration-toiture-${Date.now()}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    
    // 3. Créer un document texte lisible
    const configText = `
═══════════════════════════════════════════════════
    CONFIGURATION DE VOTRE TOITURE
    De Nys Clément - Couvreur Professionnel
═══════════════════════════════════════════════════

Date de création: ${configuration.date}

─────────────────────────────────────────────────
CARACTÉRISTIQUES DE LA TOITURE
─────────────────────────────────────────────────
Type de toiture    : ${configuration.toiture.type}
Matériau           : ${configuration.toiture.materiau}
Couleur            : ${configuration.toiture.couleur}
Pente              : ${configuration.toiture.pente}

─────────────────────────────────────────────────
ÉLÉMENTS SUPPLÉMENTAIRES
─────────────────────────────────────────────────
Cheminée           : ${configuration.elements.cheminee}
Fenêtre de toit    : ${configuration.elements.fenetreToit}
Gouttières cuivre  : ${configuration.elements.gouttieres}
Panneaux solaires  : ${configuration.elements.panneauxSolaires}

─────────────────────────────────────────────────
PERFORMANCE & QUALITÉ
─────────────────────────────────────────────────
Isolation          : ${configuration.qualite.isolation}
Garantie           : ${configuration.qualite.garantie}
Finition           : ${configuration.qualite.finition}

═══════════════════════════════════════════════════

Cette configuration a été générée par le configurateur
3D de De Nys Clément.

Pour obtenir un devis personnalisé gratuit, 
contactez-nous :
📞 +32 4XX XX XX XX
✉️ contact@denysclement.be

═══════════════════════════════════════════════════
    `;
    
    const textBlob = new Blob([configText], { type: 'text/plain' });
    const textUrl = URL.createObjectURL(textBlob);
    const textLink = document.createElement('a');
    textLink.download = `ma-toiture-${Date.now()}.txt`;
    textLink.href = textUrl;
    textLink.click();
    URL.revokeObjectURL(textUrl);
    
    // Message de confirmation
    alert('✅ Configuration sauvegardée !\n\n' +
          '📥 Vous avez téléchargé :\n' +
          '• Image 3D de votre toiture\n' +
          '• Fichier de configuration (JSON)\n' +
          '• Résumé détaillé (TXT)\n\n' +
          'Conservez ces fichiers pour votre devis personnalisé !');
}

// ================================
// INITIALISATION AU CHARGEMENT
// ================================

window.addEventListener('load', () => {
    init3D();
    setupCameraControls();
    setupEventListeners();
});
