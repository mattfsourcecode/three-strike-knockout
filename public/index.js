//Card SVG
const cards = [];
const suits = [ 'C', 'D', 'H', 'S' ];
const values = [ '2', '3', '4', '5', '6', '7', '8', '9', '10', 'A', 'J', 'K', 'Q' ];
for(let s=0; s<suits.length; s++){
    const suit = suits[s];
    for(let v=0; v<values.length; v++){
        const value = values[v];
        cards.push(`./svg/cards/${suit}${value}.svg`);
    }
}

var arr = [];
while(arr.length < cards.length){
    var randomNumber = Math.floor(Math.random() * 100) + 1;
    if(arr.indexOf(randomNumber) === -1) arr.push(randomNumber);
}

//Chip SVG
const chips = [];
for(let i=0; i<4; i++){
    chips.push(`./svg/chips/chip-${i}.svg`);
}

const getRandomInt = (max) => {
    return Math.floor(Math.random() * Math.floor(max));
}

const shuffle = (arr, total) => {
    for (var i=arr.length-1; i>0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }
    return arr.slice(0,total);
}

let numberOfCards = 25;
let totalCards = Array.from(Array(52).keys());
const shuffledCards = shuffle(totalCards, numberOfCards);

let numberOfChips = 3;
let totalChips = Array.from(Array(5).keys());
const shuffledChips = shuffle(totalChips, numberOfChips);

let Engine = Matter.Engine,
Render = Matter.Render,
World = Matter.World,
Bodies = Matter.Bodies,
Composites = Matter.Composites,
Constraint = Matter.Constraint,
Events = Matter.Events,
Composite = Matter.Composite;;

let engine = Engine.create();
let render = Render.create({
    element: document.querySelector('#matter'),
    engine: engine,
    options: {
        wireframes: false,
        pixelRatio: 2.0, //Resolution of svg elements
        height: window.innerHeight-parseInt(window.getComputedStyle(document.querySelector("#header")).height, 10)-105, //This height calculated method could be re-evaluated
        width: window.innerWidth,
        background: '#111827',
    }
});

Engine.run(engine);
Render.run(render);

const chipX = 220;
const chipY = 250;
const chipScale = .5;

// add bodies
let chip = Bodies.circle(chipX, chipY, 20, {
        density: 0.05,
        render: {
            sprite: {
              texture: chips[shuffledChips[0]],
              xScale: chipScale,
              yScale: chipScale
            }
        }
    }),
    anchor = { x: chipX, y: chipY },
    elastic = Constraint.create({ 
        pointA: anchor, 
        bodyB: chip, 
        stiffness: 0.1
    });




const ground = Bodies.rectangle(790, 300, 500, 20, { isStatic: true })

const pyramid = Composites.pyramid(600, 100, 9, 10, 0, 0, function(x, y) {
    const cardIndex = shuffledCards[0]
    shuffledCards.shift();
    return Bodies.rectangle(x, y, 25, 35, {
        render: {
            sprite: {
              texture: cards[cardIndex],
              xScale: .12,
              yScale: .12
            }
        }
    });
});





Events.on(engine, 'afterUpdate', function() {
    
    if(!shuffledChips.length){
        console.log("OUT OF CHIPS");
    }

    const cardBodies = pyramid.bodies;
    if(cardBodies.length){
        for(let i=0; i<cardBodies.length; i++){
            let body = cardBodies[i];
            if(body.position.y > 500){
                Composite.remove(pyramid, body);
            }
        }
    } else {
        console.log('complete!')
    }

    if (mouseConstraint.mouse.button === -1 && (chip.position.x > chipX+20 || chip.position.y < chipY-20)) {
        shuffledChips.shift()
        chip = Bodies.circle(chipX, chipY, 20, {
            density: 0.4,
            render: {
                sprite: {
                    texture: chips[shuffledChips[0]],
                    xScale: chipScale,
                    yScale: chipScale
                }
            }
        }),
        World.add(engine.world, chip);
        elastic.bodyB = chip;
    }

});

let mouse = Matter.Mouse.create(render.canvas);
let mouseConstraint = Matter.MouseConstraint.create(engine, {mouse: mouse});

World.add(engine.world, [ground, pyramid, chip, elastic]);
World.add(engine.world, mouseConstraint);


// call when conditions are met such that the game has been won
// World.remove(engine.world, [ground, pyramid]);

// const successGround = Bodies.rectangle(790, 485, 900, 20, { isStatic: true })

// const successCardPyramid = Composites.pyramid(500, -200, 19, 20, 0, 0, function(x, y) {
//     return Bodies.rectangle(x, y, 25, 35, {
//         restitution: 1.4,
//         render: {
//             sprite: {
//               texture: cards[getRandomInt(cards.length)],
//               xScale: .12,
//               yScale: .12
//             }
//         }
//     });
// });

// const successChipPyramid = Composites.pyramid(600, -50, 12, 13, 0, 0, function(x, y) {
//     return Bodies.circle(x, y, 10, {
//         restitution: 1.4,
//         render: {
//             sprite: {
//               texture: chips[getRandomInt(chips.length)],
//               xScale: .12,
//               yScale: .12
//             }
//         }
//     });
// });

// World.add(engine.world, [successGround, successCardPyramid, successChipPyramid]);




render.mouse = mouse;