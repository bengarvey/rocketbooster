var game = new Phaser.Game(1600, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update });

function preload() {
  game.load.image('sky', 'assets/sky.png');
  game.load.image('ground', 'assets/platform.png');
  game.load.image('star', 'assets/star.png');
  game.load.spritesheet('dude', 'assets/owen.png', 32, 48);
  game.load.spritesheet('snake', 'assets/snake.png', 96, 97);
  game.load.spritesheet('bunny', 'assets/bunny.png', 29, 25);
  game.load.spritesheet('bee', 'assets/bee.png', 73, 72);
  game.load.image('sword', 'assets/star.png');
  game.load.image('grass', 'assets/grass.png');
  game.load.image('cloud', 'assets/cloud.png');
  game.load.image('jetpack', 'assets/jetpack.png');

  game.load.image('spider', 'assets/spider.png');
  game.load.image('tree1', 'assets/tree1.png');
  game.load.image('tree2', 'assets/tree2.png');
  game.load.image('tree3', 'assets/tree3.png');
  game.load.audio('music', ['assets/space.m4a']);

}

var sky;
var player;
var platforms;
var cursors;
var mobs = [];
var sword;
var fixed;
var items;
var score = 0;
var scoreText;
var levelText;
var gameStatus;;
var jetpack;
var jetpackEmitter;
var music;
var level = 1;
var grasses;
var clouds;

var GRASS_LEVEL = 1;
var FORREST_LEVEL = 2;

var LEVEL_LENGTH = 10000;

// Prelude to the game loop
function create() {
  //  We're going to be using physics, so enable the Arcade Physics system
  game.physics.startSystem(Phaser.Physics.ARCADE);
  game.world.setBounds(0,0,LEVEL_LENGTH,600);

  //  A simple background for our game
  sky = game.add.sprite(0, 0, 'sky');
  sky.scale.setTo(200, 1);
  weapons = game.add.group();

  // Generate world
  createWorld(game, level);

  // Load everything
  jetpack = createJetpack(game);
  jetpackEmitter = createJetpackEmitter(game, jetpack);
  player = createPlayer(game);
  mobs = createMobs(game, level);
  items = createItems(game);
  platforms = createPlatforms(game);

  if (level == GRASS_LEVEL) {
    music = game.add.audio('music');
    music.play('');
  }

  //  The score
  scoreText = game.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#CCC' });
  scoreText.fixedToCamera = true;
  levelText = game.add.text(16, 32, 'Level 1', { fontSize: '32px', fill: '#CCC' });
  levelText.fixedToCamera = true;
  gameStatus = game.add.text(500, 16, '', { fontSize: '64pt', fill: '#F00' });
  gameStatus.fixedToCamera = true;

  //  Our controls
  cursors = game.input.keyboard.createCursorKeys();
  spacebar = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR); 
}

// Our game loop
function update() {
  checkPhysics(game);
  checkInput(cursors, spacebar, player, jetpackEmitter);
  checkLimits(player, game);

  if (player.alive) {
    followPlayer(jetpack, player, -13, 0);
  }

  followSprite(jetpackEmitter, jetpack, 10, 50);
  checkAnimations(player);
  checkScore(scoreText, levelText, player);
}

function checkScore (scoreText, levelText, player) {
  scoreText.text = 'Score: ' + Math.round(player.x/100);
  levelText.text = 'Level: ' + level;
}

function touchSnake (player, snake) {
  player.kill();
  jetpack.kill();
  gameOver();
}

function collectStar (player, star) {
  // Removes the star from the screen
  star.kill();

  //  Add and update the score
  score += 100;
}

function attack(attacker, attacked) {
  attacked.kill();
}

function gameOver() {
  gameStatus.text = "Game Over";
}

function createPlayer(game) {
  // The player and its settings
  player = game.add.sprite(32, game.world.height - 250, 'dude');

  // Follow him around
  game.camera.follow(player);
  game.camera.deadzone = new Phaser.Rectangle(200, 200, 300, 300);

  //  We need to enable physics on the player
  game.physics.arcade.enable(player);

  //  Player physics properties. Give the little guy a slight bounce.
  player.body.bounce.y = 0.5;
  player.body.bounce.x = 0.5;
  player.body.gravity.y = 500;
  player.body.collideWorldBounds = true;
  player.body.velocity.x = 270;
  player.body.velocity.max = 500;

  //  Our two animations, walking left and right.
  player.animations.add('left', [0, 1, 2, 3], 10, true);
  player.animations.add('right', [5, 6, 7, 8], 10, true);

  return player;
}

// Create all the bad guys
function createMobs(game, level) {
  mobs = [];
  mobs = game.add.group();
  mobTypes = getMobTypes();

  for(i=0; i<20; i++) {
    var mob = mobs.create(getRandomWorldX(game), 0, getMob());
    game.physics.arcade.enable(mob);
    mob.body.bounce.y = 0.5;
    mob.body.gravity.y = 300;
    mob.body.collideWorldBounds = true;
    mob.body.velocity.x = Math.round(Math.random() * -250);
    mob.body.bounce.y = 0.5 + Math.random() * 0.5;
  }

  return mobs;
}

function getMobTypes(level) {
  var names = [['snake', 'bunny', 'bee'], ['spider']];
  return names[level-1];
}

function getMob() {
  mobTypes = getMobTypes(level);
  totalMobs = mobTypes.length;
  random = Math.random() * (totalMobs-1);
  randomIndex = Math.round(random);
  return mobTypes[randomIndex];
}

// Create all the items the user can pick up
function createItems(game) {
  items = game.add.group();

  //  We will enable physics for any item created in this group
  items.enableBody = true;

  totalItems = 50;
  for (var i = 0; i < totalItems; i++) {
      //  Create a star inside of the 'items' group
      var star = items.create((game.world.width/totalItems)*i, 0, 'star');
      //  Let gravity do its thing
      star.body.gravity.y = 90;
      //  This just gives each star a slightly random bounce value
      star.body.bounce.y = 0.7 + Math.random() * 0.8;
      star.body.velocity.x = getRandomFromRange(400);
  }

  return items;
}

function createPlatforms(game) {
  //  The platforms group contains the ground and the 2 ledges we can jump on
  platforms = game.add.group();

  //  We will enable physics for any object that is created in this group
  platforms.enableBody = true;

  // Who's that? Ground.
  var ground = platforms.create(0, game.world.height - 64, 'ground');

  //  Scale it to fit the width of the game world
  ground.scale.setTo(200, 2);

  //  This stops it from falling away when you jump on it
  ground.body.immovable = true;

  /*
  // Create a bunch of random ledges
  totalLedges = 25;
  for (i=0; i<totalLedges; i++) {
    var x = getRandomWorldX(game);
    var y = getRandomWorldY(game);
    var ledge = platforms.create(x, y, 'ground');
    ledge.scale.setTo(Math.random() * 3, Math.random() * 2);
    ledge.body.immovable = true;
  }
  */
  return platforms;
}

function createJetpack(game) {
  var jetpack = game.add.sprite(100, 100, 'jetpack');
  return jetpack;
}

function createJetpackEmitter(game, jetpack) {
  var emitter = game.add.emitter(jetpack.x, jetpack.y, 1000);
  emitter.width = 1;
  emitter.height = 1;
  emitter.makeParticles('star');
  emitter.setRotation(-100, 100);
  emitter.setXSpeed(0,0);
  emitter.setYSpeed(50,400);
  emitter.minParticleScale = 0.1;
  emitter.maxParticleScale = 0.6;
  emitter.setAll('body.allowGravity', true);
  return emitter;
}

function getRandomWorldX(game) {
  return Math.round(game.world.width * Math.random());
}

function getRandomWorldY(game) {
  return Math.round(game.world.height * Math.random());
}

// Decide which game objects can interact with each other
function checkPhysics(game) {
  //  Collide all the stuff with platforms
  game.physics.arcade.collide(player, platforms);
  game.physics.arcade.collide(jetpack, platforms);
  game.physics.arcade.collide(items, platforms);
  game.physics.arcade.collide(mobs, platforms);

  //  functions specific collisions
  game.physics.arcade.overlap(player, items, collectStar, null, this);
  game.physics.arcade.overlap(player, mobs, touchSnake, null, this);

}

// Handle User input
function checkInput(cursors, spacebar, player, jetpackEmitter) {

  if(!player.alive) {
    jetpackEmitter.start(false, 10000, 10, 0, false);
    return;
  }

  if (cursors.left.isDown) {
    //  Move to the left faster
    player.body.velocity.x += -50;
  }
  else if (cursors.right.isDown) {
   //  Move to the right faster
    player.body.velocity.x += 50;
  }

  //  Allow the player to jump, even if they are touching the ground
  if (cursors.up.isDown || game.input.pointer1.isDown) {
    player.body.velocity.y = -300;
    jetpackEmitter.start(false, 10000, 0, 0, false);
  }
  else {
    jetpackEmitter.start(false, 10000, 10, 0, false);
  }

  // Swordfight!
  if (spacebar.isDown) {
    sword = weapons.create(player.body.x+2, player.body.y, 'sword');
  }
  else {
    if (sword != null) {
      sword.kill();
    }
  }
}

// Useful for clinging items to the player
function followPlayer(follower, leader, offsetX, offsetY) {
  directionX = leader.body.velocity.x > 1 ? 1 : -1
  follower.x = leader.body.x + (offsetX * directionX);
  follower.y = leader.body.y + offsetY;
  return follower;
}

function followSprite(follower, leader, offsetX, offsetY) {
  follower.x = leader.x + offsetX;
  follower.y = leader.y + offsetY;
  return follower;
}

// Enfoce any limits on behavior
function checkLimits(player, game) {
  // Speed limit
  if (player.body.velocity.x > player.body.velocity.max) {
    player.body.velocity.x = player.body.velocity.max;
  }
  else if (player.body.velocity.x < player.body.velocity.max * -1) {
    player.body.velocity.x = player.body.velocity.max * -1;
  }

  if (player.body.x > game.world.width-100) {
    level++;
    create();
  }

  return player;
}

function checkAnimations(player) {
  // Show the correct animation sequence depending on their velocity
  if (player.body.velocity.x > 0) {
    player.animations.play('right');
  }
  else if (player.body.velocity.x < 0) {
    player.animations.play('left');
  }
  else {
    player.frame = 4;
  }
}

function getRandomFromRange(range) {
  random = (Math.random() * range) - (range/2);
  return Math.round(random);
}

function createGrass(game) {
  grasses = game.add.group();
  for(i=0; i<50; i++) {

    scaleX = 0.25;
    scaleY = 0.4;
    grass = game.add.sprite(i*1024*scaleX, game.world.height-150, 'grass');
    grass.scale.setTo(scaleX, scaleY);
  }

  return grasses;
}

function createClouds(game) {
  clouds = game.add.group();
  for(i=0; i<8; i++) {
    scaleX = 0.25;
    scaleY = 0.25;
    cloud = game.add.sprite(getRandomWorldX(game), 10, 'cloud');
    grass.scale.setTo(scaleX, scaleY);
  }
  return clouds;
}

function createTrees(game) {
  clouds = game.add.group();
  for(i=0; i<8; i++) {
    scaleX = 0.25;
    scaleY = 0.25;
    cloud = game.add.sprite(getRandomWorldX(game), 10, getRandomTree());
    grass.scale.setTo(scaleX, scaleY);
  }
  console.log(clouds);
  return clouds;
}

function getRandomTree() {
  trees = ['tree1', 'tree2', 'tree3'];
  randomIndex = Math.round(Math.random() * (trees.length-1));
  return trees[randomIndex];
}

function createWorld(game, level) {

  console.log(game, level,  GRASS_LEVEL);
  if (level == GRASS_LEVEL) {
    console.log(level, GRASS_LEVEL);
    grasses = createGrass(game);
    clouds = createClouds(game);
  }
  else if (level == FORREST_LEVEL) {
    grasses = createGrass(game);
    clouds = createTrees(game);
  }
}
