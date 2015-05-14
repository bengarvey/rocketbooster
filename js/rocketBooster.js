var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update });

function preload() {
  game.load.image('sky', 'assets/sky.png');
  game.load.image('ground', 'assets/platform.png');
  game.load.image('star', 'assets/star.png');
  game.load.spritesheet('dude', 'assets/owen.png', 32, 48);
  game.load.spritesheet('girl', 'assets/sasha.png', 32, 48);
  game.load.spritesheet('snake', 'assets/snake.png', 96, 97);
  game.load.spritesheet('bunny', 'assets/bunny.png', 29, 25);
  game.load.spritesheet('bee', 'assets/bee.png', 73, 72);
  game.load.spritesheet('alien', 'assets/alien.png', 100, 50);

  game.load.image('sword', 'assets/star.png');
  game.load.image('grass', 'assets/grass.png');
  game.load.image('cloud', 'assets/cloud.png');
  game.load.image('jetpack', 'assets/jetpack.png');

  game.load.image('blacksky', 'assets/blacksky.png');
  game.load.image('spacesky', 'assets/spacesky.png');
  game.load.image('darksky', 'assets/darksky.png');
  game.load.image('spider', 'assets/spider.png');
  game.load.image('tree1', 'assets/tree1.png');
  game.load.image('tree2', 'assets/tree2.png');
  game.load.image('tree3', 'assets/tree3.png');
  game.load.audio('music1', ['assets/grass.m4a']);
  game.load.audio('music2', ['assets/forrest.m4a']);
  game.load.audio('music3', ['assets/cave.m4a']);
  game.load.audio('music4', ['assets/cloud.m4a']);
  game.load.audio('music5', ['assets/space.m4a']);

  game.load.image('greenCrystal', 'assets/greenCrystal.png');
}

var sky;
var player;
var player2;
var playerType;
var platforms;
var cursors;
var mobs;
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
var level = 0;
var grasses;
var clouds;
var titleObjects;
var titleSprite;
var debug;

var START_LEVEL = 0;
var GRASS_LEVEL = 1;
var FORREST_LEVEL = 2;
var CAVE_LEVEL = 3;
var CLOUD_LEVEL = 4;
var SPACE_LEVEL = 5;

var levelLength = 10000;
var MOBS_PER_LEVEL = 10;

// Prelude to the game loop
function create() {
  levelLength = getLevelLength(level);

  //  We're going to be using physics, so enable the Arcade Physics system
  game.physics.startSystem(Phaser.Physics.ARCADE);
  game.world.setBounds(0,0,levelLength,600);

  // If we're redoing a level, unload everything first
  unload(sky);
  unloadAll(mobs);
  unloadAll(items);
  unload(jetpack);
  unload(jetpackEmitter);
  unload(player);
  unloadAll(platforms);
  unloadAll(grasses);
  unloadAll(clouds);
  game.physics.startSystem(Phaser.Physics.ARCADE);
  sky = createSky(level);
  weapons = game.add.group();

  // Generate world
  platforms = createPlatforms(game);
  createWorld(game, level);

  // Load everything
  jetpack = createJetpack(game);
  jetpackEmitter = createJetpackEmitter(game, jetpack);
  startX = level == START_LEVEL ? 250 : 32;
  playerType = playerType == null ? 'girl' : playerType;
  player = createPlayer(game, level, playerType, startX);
  if (level == START_LEVEL) {
    player2 = createPlayer(game, level, 'dude', startX*2);
  }

  mobs = createMobs(game, level);
  items = createItems(game);

  music = resetMusic(music, level);

  //  The score
  scoreText = game.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#CCC' });
  scoreText.fixedToCamera = true;
  levelText = game.add.text(16, 40, 'Level 1', { fontSize: '32px', fill: '#CCC' });
  levelText.fixedToCamera = true;
  gameStatus = game.add.text(500, 16, '', { fontSize: '64pt', fill: '#F00' });
  gameStatus.fixedToCamera = true;
  debug = game.add.text(16, 70, 'DEBUG', { fontSize: '14px', fill: '#CCC' });
  debug.fixedToCamera = true;

  // Title screen
  titleObjects = getTitleObjects(level);
  //titleShadow = game.add.text(50, 53, 'Rocketbooster!', {font: '100px Impact', fill: '#111'});
  //title = game.add.text(50, 50, 'Rocketbooster!', {font: '100px Impact', fill: '#F33'});
  //instructions = game.add.text(50, 160, 'Collect stars to power your jetpack.', {font: '20px Arial', fill: '#FFF'});
  titleSprite = game.add.sprite(0, 50, null);
  //titleSprite.addChild(titleShadow);
  //titleSprite.addChild(title);
  //titleSprite.addChild(instructions);
  for(var i=0; i<titleObjects.length; i++) {
    titleSprite.addChild(titleObjects[i]);
  }

  titleSprite.fixedToCamera = true;
  game.physics.enable(titleSprite, Phaser.Physics.ARCADE);
  titleSprite.body.gravity.y = 0;
  //  Our controls
  cursors = game.input.keyboard.createCursorKeys();
  spacebar = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
}

// Our game loop
function update() {
  checkPhysics(game);
  score = checkInput(cursors, spacebar, player, jetpackEmitter, score);
  checkLimits(player, game);

  if (player.alive) {
    followPlayer(jetpack, player, -13, 0);
  }

  followSprite(jetpackEmitter, jetpack, 10, 50);
  checkAnimations(player);
  checkScore(scoreText, levelText, player, score);
  checkTitle(titleSprite, player);
}

function getLevelLength(level) {
  length = 10000;
  if (level == START_LEVEL) {
    length = 500;
  }
  return length;
}

function getTitleObjects (level) {
  var list = [];
  var title = "Rocketbooster!";
  var instructions = 'Choose Sasha or Owen to start!';
  var color = '#F33';

  if (level == GRASS_LEVEL) {
    title = "Grass Level!";
    instructions = 'Collect starts to power your jetpack.';
  }
  else if (level == FORREST_LEVEL) {
    title = 'Forrest Level!';
    instructions = 'Watch out for snakes!';
    color = '#2E2';
  }
  else if (level == CAVE_LEVEL) {
    title = "Cave Level!";
    instructions = 'Collect the gems for the next level';
    color = '#DDF';
  }
  else if (level == CLOUD_LEVEL) {
    title = "Cloud Level!";
    instructions = "Don't fall off the bottom of the screen!";
    color = '#22F';
  }
  else if (level == SPACE_LEVEL) {
    title = "Space Level!";
    instructions = 'The final level';
    color = '#0FF';
  }

  return [game.add.text(50, 53, title, {font: '100px Impact', fill: '#111'}),
          game.add.text(50, 50, title, {font: '100px Impact', fill: color}),
          game.add.text(50, 160, instructions, {font: '20px Arial', fill: '#FFF'})];
}

function checkTitle (titleSprite, player) {
  if (player.body.x > 1000) {
    titleSprite.fixedToCamera = false;
    titleSprite.body.bounce.y = 1;
    titleSprite.body.gravity.y = 500;
    titleSprite.body.collideWorldBounds = false;
  }
}

function checkScore (scoreText, levelText, player, score) {
  scoreText.text = 'Score: ' + score;
  levelText.text = 'Level: ' + level;
  debug.text = 'x: ' + Math.round(player.body.x) + " y: " + Math.round(player.body.y) + " dx: " + Math.round(player.body.velocity.x) + " dy: " + Math.round(player.body.velocity.y);
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

function createPlayer(game, level, type, startX) {
  // The player and its settings
  var player = game.add.sprite(startX, game.world.height - 250, type);
  player.inputEnabled = true;
  player.input.useHandCursor = true; //if you want a hand cursor
  player.events.onInputDown.add(choosePlayer, this);
    // Follow him around
  game.camera.follow(player);
  game.camera.deadzone = new Phaser.Rectangle(200, 200, 100, 100);

  //  We need to enable physics on the player
  game.physics.arcade.enable(player);

  //  Player physics properties. Give the little guy a slight bounce.
  player.body.bounce.y = 0.5;
  player.body.bounce.x = 0.5;
  player.body.gravity.y = 500;
  player.body.collideWorldBounds = getCollideWorldBounds(level);
  player.body.velocity.x = level == START_LEVEL ? 0 : 270;
  player.body.velocity.max = 500;
  player.checkWorldBounds = true;
  player.events.onOutOfBounds.add(playerOut, player);
  //  Our two animations, walking left and right.
  player.animations.add('left', [0, 1, 2, 3], 10, true);
  player.animations.add('right', [5, 6, 7, 8], 10, true);
  return player;
}

function playerOut(p) {
  p.kill();
  if (!player.alive) {
    gameOver();
  }
}

function getCollideWorldBounds(level) {
  if (level == CLOUD_LEVEL || level == SPACE_LEVEL) {
    return false;
  }
  else {
    return true;
  }
}

// Create all the bad guys
function createMobs(game, level) {
  mobs = [];
  mobs = game.add.group();
  mobTypes = getMobTypes();
  for(i=0; i<MOBS_PER_LEVEL && level != START_LEVEL; i++) {
    var mob = mobs.create(getRandomWorldX(game) + 1000, getInitialY(level, game), getMob());
    game.physics.arcade.enable(mob);
    mob.body.bounce.y = 0.5;
    mob.body.gravity.y = getYGravity(level);
    mob.body.velocity.x = getXVelocity(level);
    mob.body.velocity.y = getYVelocity(level);
    mob.body.bounce.y = 0.5 + Math.random() * 0.5;
    mob.outOfBoundsKill = true;
  }

  return mobs;
}

function getInitialY(level, game) {
  var y = 0;
  if (level == SPACE_LEVEL || level == CLOUD_LEVEL) {
    y = getRandomWorldY(game);
  }

  return y;
}

function getYGravity(level) {
  var gravity = 300;
  if (level == SPACE_LEVEL || level == CLOUD_LEVEL) {
    gravity = 0;
  }
  return gravity;
}

function getYVelocity(level) {
  var velocity = 0;
  if (level == SPACE_LEVEL) {
    velocity = Math.round( (Math.random() * 10) - 5 );
  }
  return velocity;
}

function getXVelocity(level) {
  var velocity = Math.round(Math.random() * -250);
  if (level == SPACE_LEVEL) {
    velocity = Math.round( Math.random() * -100) - 100;
  }
  return velocity;
}

function getMobTypes(level) {
  var names = [['bunny'], ['snake'], ['spider'], ['bee'], ['alien']];
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

  if (level == GRASS_LEVEL || level == FORREST_LEVEL) {
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
  }
  else if (level == CAVE_LEVEL) {
    totalItems = 50;
    for (var i = 0; i < totalItems; i++) {
        //  Create a star inside of the 'items' group
        var x = getRandomWorldX(game);
        var y = getRandomWorldY(game);
        var crystal = items.create(x, y, 'greenCrystal');
    }

  }
  else if (level == CLOUD_LEVEL || level == SPACE_LEVEL) {
    totalItems = 50;
    for (var i = 0; i < totalItems; i++) {
        //  Create a star inside of the 'items' group
        var star = items.create((game.world.width/totalItems)*i, Math.random() * game.world.height, 'star');
        //  Let gravity do its thing
        star.body.gravity.y = Math.round( (Math.random() * 10) - 5);
        //  This just gives each star a slightly random bounce value
        star.body.bounce.y = 0.7 + Math.random() * 0.8;
        star.body.velocity.x = getRandomFromRange(30);
    }
  }
  else {
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
  }


  return items;
}

function addGround(game, platforms, yOffset) {
  // Who's that? Ground.
  var ground = platforms.create(0, game.world.height - yOffset, 'ground');

  //  Scale it to fit the width of the game world
  ground.scale.setTo(200, 2);

  //  This stops it from falling away when you jump on it
  ground.body.immovable = true;

  return platforms;
}

function createPlatforms(game) {
  //  The platforms group contains the ground and the 2 ledges we can jump on
  platforms = game.add.group();

  //  We will enable physics for any object that is created in this group
  platforms.enableBody = true;

  if (level == GRASS_LEVEL) {
    platforms = addGround(game, platforms, 64);
    // Add some random ledges near the top and bottom of the cave
    var totalPerSide = 5;
    for (i=0; i<totalPerSide; i++) {
      var x = getRandomWorldX(game);
      var y = game.world.height - Math.round(Math.random() * 300);
      var scaleY = Math.round(Math.random() * 100);
      var bottom = platforms.create(x, y, 'ground');
      bottom.scale.setTo(0.5, scaleY);
      bottom.body.immovable = true;
    }
  } else if (level == CAVE_LEVEL) {
    platforms = addGround(game, platforms, 64);

    // Add some random ledges near the top and bottom of the cave
    var totalPerSide = 30;
    for (i=0; i<totalPerSide; i++) {
      var x = getRandomWorldX(game);
      var y = 0;
      var scaleY = Math.round(Math.random() * 2);
      var top = platforms.create(x, y, 'ground');
      top.scale.setTo(0.1, scaleY);
      top.body.immovable = true;

      x = getRandomWorldX(game);
      y = game.world.height - Math.round(Math.random() * 300);
      scaleY = Math.round(Math.random() * 10);
      var bottom = platforms.create(x, y, 'ground');
      bottom.scale.setTo(0.1, scaleY);
      bottom.body.immovable = true;

    }
  }
  else if (level == CLOUD_LEVEL) {
    // Repurposing this for a ceiling
    platforms = addGround(game, platforms, game.world.height + 64);
  }
  else if (level == CLOUD_LEVEL || level == SPACE_LEVEL) {
  
  }
  else {
   platforms = addGround(game, platforms, 64);
  }

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
  game.physics.arcade.collide(player2, platforms);
  game.physics.arcade.collide(jetpack, platforms);
  game.physics.arcade.collide(items, platforms);
  game.physics.arcade.collide(mobs, platforms);

  //  functions specific collisions
  game.physics.arcade.overlap(player, items, collectStar, null, this);
  game.physics.arcade.overlap(player, mobs, touchSnake, null, this);

}

function canJump(cursors, score) {
  return ((cursors.up.isDown || game.input.pointer1.isDown) && (score > 0 || (Math.round(player.body.velocity.y) == -3 )));
}

// Handle User input
function checkInput(cursors, spacebar, player, jetpackEmitter, score) {

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

  //  Allow the player to jump, even if they are touching the ground if they have energy
  if (canJump(cursors, score)) {
    player.body.velocity.y = -300;
    score += -5;
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

  return score;
}

function choosePlayer(p, event) {
  playerType = p.key;
  player = p;
  level = GRASS_LEVEL;
  create();
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
  //if (player.body.x > 1000) {
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
  for(i=0; i<75; i++) {

    scaleX = 0.25;
    scaleY = 0.4;
    grass = game.add.sprite(i*1024*scaleX, game.world.height-100, 'grass');
    grass.scale.setTo(scaleX, scaleY);
  }

  return grasses;
}

function createClouds(game) {
  clouds = game.add.group();
  for(i=0; i<8; i++) {
    cloud = game.add.sprite(getRandomWorldX(game), 10, 'cloud');
  }
  return clouds;
}

function createTrees(game) {
  clouds = game.add.group();
  for(i=0; i<40; i++) {
    scaleX = 2;
    scaleY = 2;
    tree = game.add.sprite(getRandomWorldX(game), 100, getRandomTree());
    tree.scale.setTo(scaleX, scaleY);
  }
  return clouds;
}

function getRandomTree() {
  trees = ['tree2'];
  randomIndex = Math.round(Math.random() * (trees.length-1));
  return trees[randomIndex];
}

function createWorld(game, level) {

  if (level == GRASS_LEVEL) {
    grasses = createGrass(game);
    clouds = createClouds(game);
  }
  else if (level == FORREST_LEVEL) {
    clouds = createTrees(game);
    grasses = createGrass(game);
  }
  else if (level == CAVE_LEVEL) {
  }
  else {
  }

}

function unloadAll(thing) {
  if (typeof(thing) != 'undefined' && typeof(thing.callAll()) != 'undefined') {
    thing.callAll('kill');
  }
}

function unload(thing) {
  if (typeof(thing) != 'undefined') {
    thing.kill();
  }
}

function createSky(level) {
  console.log(level == SPACE_LEVEL);
  if (level == GRASS_LEVEL) {
    sky = game.add.sprite(0, 0, 'sky');
    sky.scale.setTo(200, 1);
  }
  else if (level == FORREST_LEVEL) {
    sky = game.add.sprite(0, 0, 'darksky');
    sky.scale.setTo(200, 1);
  }
  else if (level == CAVE_LEVEL) {
    sky = game.add.sprite(0, 0, 'blacksky');
    sky.scale.setTo(200, 1);
  }
  else if (level == CLOUD_LEVEL) {
    sky = game.add.sprite(0, 0, 'sky');
    sky.scale.setTo(200, 1);
  }
  else if (level == SPACE_LEVEL) {
    console.log("here");
    sky = game.add.tileSprite(0, 0, game.world.width, game.world.height, 'spacesky');
  }
  else {
    sky = game.add.sprite(0, 0, 'sky');
    sky.scale.setTo(200, 1);
  }

  return sky;

}

function resetMusic(music, level) {
  if (music != undefined) {
    music.stop();
  }

  track = level == START_LEVEL ? 1 : level;
  music = game.add.audio('music' + track);
  music.play('');

  return music;
}
