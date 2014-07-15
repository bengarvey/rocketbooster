var game = new Phaser.Game(1600, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update });

function preload() {
  game.load.image('sky', 'assets/sky.png');
  game.load.image('ground', 'assets/platform.png');
  game.load.image('star', 'assets/star.png');
  game.load.spritesheet('dude', 'assets/owen.png', 32, 48);
  game.load.spritesheet('snake', 'assets/snake.png', 96, 112);
  game.load.spritesheet('baddie', 'assets/baddie.png', 32, 32);
  game.load.spritesheet('guy', 'assets/dude.png', 32, 48);
  game.load.image('sword', 'assets/star.png');
}

var player;
var platforms;
var cursors;
var mobs = [];
var sword;
var fixed;
var items;
var score = 0;
var scoreText;
var gameStatus;;

// Prelude to the game loop
function create() {
  //  We're going to be using physics, so enable the Arcade Physics system
  game.physics.startSystem(Phaser.Physics.ARCADE);
  game.world.setBounds(0,0,10000,600);

  //  A simple background for our game
  game.add.sprite(0, 0, 'sky');
  weapons = game.add.group();

  // Load everything
  fixed = createCameraFollower(game);
  player = createPlayer(game);
  mobs = createMobs(game);
  items = createItems(game);
  platforms = createPlatforms(game);

  //  The score
  scoreText = game.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#CCC' });
  scoreText.fixedToCamera = true;
  gameStatus = game.add.text(500, 16, '', { fontSize: '1024px', fill: '#F00' });
  gameStatus.fixedToCamera = true;

  //  Our controls
  cursors = game.input.keyboard.createCursorKeys();
  spacebar = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR); 
}

// Our game loop
function update() {
  checkPhysics(game);
  checkInput(cursors, spacebar, player);
  checkLimits(player);
  checkAnimations(player);
}

function touchSnake (player, snake) {
  player.kill();
  gameOver();
}

function collectStar (player, star) {
  // Removes the star from the screen
  star.kill();

  //  Add and update the score
  score += 10;
  scoreText.text = 'Score: ' + score;
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
function createMobs(game) {
  mobs = [];
  mobs = game.add.group();
  mobTypes = getMobTypes();

  for(i=0; i<20; i++) {
    var mob = mobs.create(getRandomWorldX(game), 0, getMob());
    game.physics.arcade.enable(mob);
    mob.body.bounce.y = 0.5;
    mob.body.gravity.y = 300;
    mob.body.collideWorldBounds = true;
    mob.body.bounce.y = 0.5 + Math.random() * 0.5;
  }

  return mobs;
}

function getMobTypes() {
  var names = ['snake', 'baddie', 'guy'];
  return names;
}

function getMob() {
  mobTypes = getMobTypes();
  totalMobs = mobTypes.length;
  random = Math.random() * totalMobs;
  randomIndex = Math.round(random);
  return mobTypes[randomIndex];
}

// Create all the items the user can pick up
function createItems(game) {
  items = game.add.group();

  //  We will enable physics for any item created in this group
  items.enableBody = true;

  totalItems = 100;
  for (var i = 0; i < totalItems; i++) {
      //  Create a star inside of the 'items' group
      var star = items.create((game.world.width/totalItems)*i, 0, 'star');
      //  Let gravity do its thing
      star.body.gravity.y = 90;
      //  This just gives each star a slightly random bounce value
      star.body.bounce.y = 0.7 + Math.random() * 0.8;
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

  // Create a bunch of random ledges
  totalLedges = 25;
  for (i=0; i<totalLedges; i++) {
    var x = getRandomWorldX(game);
    var y = getRandomWorldY(game);
    var ledge = platforms.create(x, y, 'ground');
    ledge.scale.setTo(Math.random() * 3, Math.random() * 2);
    ledge.body.immovable = true;
  }

  return platforms;
}

// I think this creates an object that the camera can follow around the game world
function createCameraFollower(game) {
  var cameraFollower = game.add.sprite(100, 100, '');
  cameraFollower.fixedToCamera = true;
  cameraFollower.cameraOffset.x = 100;
  cameraFollower.cameraOffset.y = 300;

  return cameraFollower;
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
  game.physics.arcade.collide(items, platforms);
  game.physics.arcade.collide(mobs, platforms);

  //  functions specific collisions
  game.physics.arcade.overlap(player, items, collectStar, null, this);
  game.physics.arcade.overlap(player, mobs, touchSnake, null, this);

}

// Handle User input
function checkInput(cursors, spacebar, player) {
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

// Enfoce any limits on behavior
function checkLimits(player) {
  // Speed limit
  if (player.body.velocity.x > player.body.velocity.max) {
    player.body.velocity.x = player.body.velocity.max;
  }
  else if (player.body.velocity.x < player.body.velocity.max * -1) {
    player.body.velocity.x = player.body.velocity.max * -1;
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

