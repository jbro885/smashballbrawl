const CANNON = require('cannon');
const THREE = require('three');

const getGuid = function getGuid() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
  return [0, 0, 0, 0].map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
};

module.exports = function Match() {
  this.guid = getGuid;
  this.clients = {};
  this.boxMeshes = [];
  this.boxes = [];
  this.ballMeshes = [];
  this.balls = [];
  this.world;
  this.loadClientUpdate = loadClientUpdate.bind(this);
  this.loadFullScene = loadFullScene.bind(this);
  this.startPhysics = startPhysics.bind(this);
  this.physicsEmitClock;
  this.physicsEmitTick = 20; //period between physics emits
  this.physicsClock;
  this.physicsTick = 1/50*1000;
};

const loadClientUpdate = function loadClientUpdate(clientPosition) {
  this.clients[clientPosition.guid] = clientPosition;
};

const startPhysics = function startPhysics(io) {
  const context = this;
  this.physicsClock = setInterval(function() {
    
    context.world.step(context.physicsTick/1000);

    // Update ball positions
    // for(var i=0; i<balls.length; i++){
    //   ballMeshes[i].position.copy(balls[i].position);
    //   ballMeshes[i].quaternion.copy(balls[i].quaternion);
    // }

    // Update box positions
    for(var i=0; i<context.boxes.length; i++){
      context.boxMeshes[i].position.copy(context.boxes[i].position);
      context.boxMeshes[i].quaternion.copy(context.boxes[i].quaternion);
    }

  }, this.physicsTick)

  this.physicsEmitClock = setInterval(function() {
    io.to(context.guid).emit('physicsUpdate', context.boxMeshes)
  }, this.physicsEmitTick)
};

const loadFullScene = function loadFullScene(scene) {
  // Setup our world
  const context = this;
  let world = new CANNON.World();
  world.quatNormalizeSkip = 0;
  world.quatNormalizeFast = false;
  
  const solver = new CANNON.GSSolver();

  world.defaultContactMaterial.contactEquationStiffness = 1e9;
  world.defaultContactMaterial.contactEquationRelaxation = 4;

  solver.iterations = 7;
  solver.tolerance = 0.1;
  world.solver = new CANNON.SplitSolver(solver);

  world.gravity.set(0,-20,0);
  world.broadphase = new CANNON.NaiveBroadphase();

  // Create a slippery material (friction coefficient = 0.0)
  const physicsMaterial = new CANNON.Material("slipperyMaterial");
  const physicsContactMaterial = new CANNON.ContactMaterial(physicsMaterial, physicsMaterial, 0.0, 0.3);
  // We must add the contact materials to the world
  world.addContactMaterial(physicsContactMaterial);
  
  // Loop through objects in scene and create copy in CANNON world
  scene.object.children.forEach(function(mesh) {
    let meshGeometry;
    scene.geometries.forEach(function(geometry) {
      if (mesh.geometry === geometry.uuid) {
        meshGeometry = geometry;
      }
    })
    if (meshGeometry && meshGeometry.type === 'BoxGeometry') {
      let position = new THREE.Vector3();
      let quaternion = new THREE.Quaternion();
      let matrix = new THREE.Matrix4();
      matrix.fromArray(mesh.matrix);
      position.setFromMatrixPosition(matrix);
      quaternion.fromArray(mesh.matrix);
      let width = meshGeometry.width;
      let height = meshGeometry.height;
      let depth = meshGeometry.depth;

      let cannonPosition = new CANNON.Vec3(position.x, position.y, position.z);
      let cannonQuat = new CANNON.Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
      let cannonSize = new CANNON.Vec3(width, height, depth);

      let cannonBox = new CANNON.Box(cannonSize);
      let mass;
      if (width === 100) {
        mass = 0;
      } else {
        mass = height*width*depth;
      }
      let cannonBody = new CANNON.Body({mass: mass});
      cannonBody.addShape(cannonBox);
      cannonBody.position = cannonPosition;
      cannonBody.quaternion = cannonQuat;
      cannonBody.linearDamping = 0.01;
      cannonBody.angularDamping = 0.01;

      context.boxMeshes.push({uuid: mesh.uuid, position, quaternion});
      context.boxes.push(cannonBody);
      world.add(cannonBody);
    }
  });
  this.world = world;
};