import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

export class LiquidLogo {
    constructor(container) {
        this.container = container
        this.width = container.clientWidth
        this.height = container.clientHeight

        this.scene = new THREE.Scene()
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })

        this.mouse = new THREE.Vector2()
        this.targetMouse = new THREE.Vector2()

        this.layers = []

        // Transparent background
        this.scene.background = null
    }

    init() {
        this.setupRenderer()
        this.setupCamera()
        this.setupLights()
        this.loadLayers()
        this.addEvents()
        this.animate()
    }

    setupRenderer() {
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        this.container.appendChild(this.renderer.domElement)
    }

    setupCamera() {
        this.camera.position.z = 5
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
        this.scene.add(ambientLight)

        this.spotLight = new THREE.SpotLight(0xffffff, 2)
        this.spotLight.position.set(0, 0, 10)
        this.spotLight.angle = 0.5
        this.spotLight.penumbra = 1
        this.spotLight.decay = 0
        this.spotLight.distance = 0
        this.scene.add(this.spotLight)
        this.scene.add(this.spotLight.target)

        // Environment map for reflections (essential for glass)
        const pmremGenerator = new THREE.PMREMGenerator(this.renderer)
        pmremGenerator.compileEquirectangularShader()
        this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture
    }

    loadLayers() {
        const loader = new THREE.TextureLoader()
        const layerPaths = [
            '/assets/images/Layer1.svg',
            '/assets/images/Layer2.svg',
            '/assets/images/Layer3.svg'
        ]

        const geometry = new THREE.PlaneGeometry(4, 4, 64, 64) // High segment count for displacement

        layerPaths.forEach((path, index) => {
            loader.load(path, (texture) => {
                texture.minFilter = THREE.LinearFilter
                texture.magFilter = THREE.LinearFilter

                const material = new THREE.MeshPhysicalMaterial({
                    map: texture,
                    transparent: true,
                    transmission: 1.0,
                    thickness: 0.5,
                    roughness: 0.1,
                    ior: 1.5,
                    envMapIntensity: 1.5,
                    clearcoat: 1.0,
                    clearcoatRoughness: 0.1,
                    side: THREE.DoubleSide
                })

                const mesh = new THREE.Mesh(geometry, material)
                mesh.position.z = index * 0.2 // Tighter stacking
                this.scene.add(mesh)
                this.layers.push(mesh)
            })
        })
    }

    addEvents() {
        window.addEventListener('resize', this.onResize.bind(this))
        window.addEventListener('mousemove', this.onMouseMove.bind(this))
        window.addEventListener('deviceorientation', this.onDeviceOrientation.bind(this))
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight
        this.camera.updateProjectionMatrix()
        this.renderer.setSize(window.innerWidth, window.innerHeight)
    }

    onMouseMove(event) {
        this.targetMouse.x = (event.clientX / window.innerWidth) * 2 - 1
        this.targetMouse.y = -(event.clientY / window.innerHeight) * 2 + 1
    }

    onDeviceOrientation(event) {
        // Gamma is left-to-right tilt in degrees, usually -90 to 90
        // Beta is front-to-back tilt in degrees, usually -180 to 180
        if (event.gamma !== null && event.beta !== null) {
            // Normalize gamma (-45 to 45) to -1 to 1
            this.targetMouse.x = Math.max(-1, Math.min(1, event.gamma / 45))

            // Normalize beta (-45 to 45) to -1 to 1 (subtracting 45 for holding angle)
            // Assuming user holds phone at ~45 degrees, so 0 would be flat, 90 upright.
            // Let's just map relative tilt.
            this.targetMouse.y = Math.max(-1, Math.min(1, (event.beta - 45) / 45))
        }
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this))

        // Smooth mouse movement
        this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.05
        this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.05

        // Move spotlight with mouse
        if (this.spotLight) {
            this.spotLight.position.x = this.mouse.x * 10
            this.spotLight.position.y = this.mouse.y * 10
            this.spotLight.target.position.x = this.mouse.x * 2
            this.spotLight.target.position.y = this.mouse.y * 2
            this.spotLight.target.updateMatrixWorld()
        }

        // Animate layers based on mouse
        const time = Date.now() * 0.001
        this.layers.forEach((layer, index) => {
            const depth = index + 1

            // Rotation
            layer.rotation.x = this.mouse.y * 0.2 * depth
            layer.rotation.y = this.mouse.x * 0.2 * depth

            // Float
            layer.position.y += Math.sin(time + index) * 0.001

            // Distortion (using displacementScale if map exists, or just position warp)
            // Since we don't have a displacement map, we can try to warp the geometry vertices
            // But modifying vertices every frame is expensive. 
            // Better to use a custom shader or just rely on the glass refraction and rotation.
            // Let's add a subtle Z-wobble to the vertices if we want "liquid" feel, 
            // but for now, let's stick to the rotation and light movement which creates the refraction effect.
        })

        this.renderer.render(this.scene, this.camera)
    }
}
