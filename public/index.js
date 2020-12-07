(function() {
    

    //Card SVG
    const buildAllCardSvgPaths = ( indexSize, backImage ) => {
        const cards = [],
            suits = [ 'C', 'D', 'H', 'S' ],
            values = [ '2', '3', '4', '5', '6', '7', '8', '9', '10', 'A', 'J', 'K', 'Q' ];
        for(let s=0; s<suits.length; s++){
            const suit = suits[s];
            for(let v=0; v<values.length; v++){
                if ( getRandomInt(4) === 3 ) {
                    cards.push(`./assets/svg/backs/${backImage}.png`);
                } else {
                    const value = values[v];
                    cards.push(`./assets/svg/cards-${indexSize}-index/${suit}${value}.svg`);
                }
            }
        }
        return cards
    }


    //Chip SVG
    const chips = [];
    for(let i=0; i<5; i++){
        chips.push(`./assets/svg/chips/chip-${i}.svg`);
    }


    const getRandomInt = (max) => {
        return Math.floor(Math.random() * Math.floor(max));
    }


    //Shuffles an array and slices to a specified index
    const shuffle = (arr, total) => {
        for (let i=arr.length-1; i>0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            let temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
        return arr.slice(0,total);
    }


    const numberOfCardsInGame = 25,
          totalCards = Array.from(Array(52).keys()),
          shuffledCards = shuffle(totalCards, numberOfCardsInGame);
    

    const numberOfChipAttempts = 3,
          totalChips = Array.from(Array(5).keys()),
          shuffledChips = shuffle(totalChips, numberOfChipAttempts);


    /**
     Milliseconds for the setTimeout method in the 'afterUpdate' loop.
     TODO: Variably adjust this number based on window.innerHeight.
    */  
    let cardBodyRemovalDelayTime = 4000

    
    let Engine = Matter.Engine,
        Render = Matter.Render,
        World = Matter.World,
        Bodies = Matter.Bodies,
        Composites = Matter.Composites,
        Constraint = Matter.Constraint,
        Events = Matter.Events,
        Composite = Matter.Composite;


    let engine = Engine.create(),
        render = Render.create({
            element: document.querySelector('#matter'),
            engine: engine,
            options: {
                wireframes: false,
                pixelRatio: 2.0, //Resolution of svg elements
                height: window.innerHeight-parseInt(window.getComputedStyle(document.querySelector("#header")).height, 10)+57, //This height calculated method could be re-evaluated
                width: window.innerWidth,
                background: '#111827',
            }
        });


    // Collision field categories
    const cardCategory = 0x0001,
          chipCategory = 0x0002;


    let mouse = Matter.Mouse.create(render.canvas),
        mouseConstraint = Matter.MouseConstraint.create(engine, {mouse: mouse});
        mouseConstraint.collisionFilter.mask = chipCategory;
        render.mouse = mouse;


    // X-Y coordinates for the picker chip slingshot
    const chipCoordinateX = 220,
          chipCoordinateY = 250,
          chipScale = .25;


    //Declare bodies
    let chip = Bodies.circle(chipCoordinateX, chipCoordinateY, 20, {
            density: 0.05,
            collisionFilter: {
                category: chipCategory,
            },
            render: {
                sprite: {
                    texture: chips[shuffledChips[0]],
                    xScale: chipScale,
                    yScale: chipScale
                }
            }
        }),
        anchor = { x: chipCoordinateX, y: chipCoordinateY },
        elastic = Constraint.create({ 
            pointA: anchor, 
            bodyB: chip, 
            stiffness: 0.1,
        }),
        ground = Bodies.rectangle(790, 300, 500, 20, { isStatic: true }),
        xAxisThreshold = 1050,
        yAxisThreshold = 500,
        gameWon = false;


    /**
     * Household member JSON
     * @constructor
     * @param {array} cards - Array of svg file paths
     */
    class CardDeck {
        constructor(cards) {
            this.cards = cards;
        }
        buildGamePyramid() {
            return Composites.pyramid(600, 100, 9, 10, 0, 0, function(x, y) {
                const cardIndex = shuffledCards[0]
                shuffledCards.shift();
                return Bodies.rectangle(x, y, 25, 35, {
                    collisionFilter: {
                        category: cardCategory,
                    },
                    render: {
                        sprite: {
                            texture: this.cards[cardIndex],
                            xScale: .12,
                            yScale: .12
                        }
                    }
                });
            }.bind(this));
        }
        buildSuccessPyramid() {
            return Composites.pyramid(500, -200, 14, 15, 0, 0, function(x, y) {
                return Bodies.rectangle(x, y, 25, 35, {
                    restitution: 1.4,
                    render: {
                        sprite: {
                            texture: this.cards[getRandomInt(this.cards.length)],
                            xScale: .12,
                            yScale: .12
                        },
                        torque: 3
                    }
                });
            }.bind(this));
        }
    }


    let cardDeckCreatedByUser,
          gamePyramid,
          cardsInPlay,
          currentCards


    const addMatterBodiesToSceneAndStartGame = () => {
        Engine.run(engine);
        Render.run(render);
        World.add(engine.world, [ground, gamePyramid, chip, elastic]);
        World.add(engine.world, mouseConstraint);
    }


    Events.on(engine, 'afterUpdate', function() {

        //gameWon is set to true when all cards have been knocked off the surface
        if ( gameWon  ) { return }

        //Uses the existing cards to determine if a card has been knocked off or if the game has been won
        if( currentCards.length ){
            //TODO: Add this to a helper method
            //set currentCards array to be mutated so that cardsInPlay can be looped through in entirety.
            for(let i=0; i<cardsInPlay.length; i++){
                let body = cardsInPlay[i];
                if( body.position.y > yAxisThreshold || body.position.x > xAxisThreshold){
                    //Remove body from currentCards
                    currentCards.splice(currentCards.indexOf(cardsInPlay[i]), 1)
                    //Removes the body from the render.     
                    setTimeout(function(){ 
                        Composite.remove(gamePyramid, body);
                    }, cardBodyRemovalDelayTime);
                }
            }
            //update cardsInPlay with the cards that remain at the end of the loop
            cardsInPlay = currentCards;
        } else {
            gameWon = true;
            startSuccessAnimation();
        }

        //Return when shuffledChips array has been emptied
        if( !shuffledChips.length ){ 
            if(engine.world.bodies[3].position.x > xAxisThreshold || engine.world.bodies[3].position.y > yAxisThreshold){
                //Add "Game Over animation here"
            }
            return
         } else {
            //Adds new chip if a chip has been used
            if (mouseConstraint.mouse.button === -1 && (chip.position.x > chipCoordinateX+20 || chip.position.y < chipCoordinateY-20)) {
                //TODO: Should this be removing the body in addition or instead of the shift method?                
                shuffledChips.shift()
                chip = Bodies.circle(chipCoordinateX, chipCoordinateY, 20, {
                    density: 0.4,
                    collisionFilter: {
                        category: chipCategory,
                    },
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
            };
         }

    });


    // call when conditions are met such that the game has been won
    const startSuccessAnimation = () => {

        World.remove(engine.world, [ground]);

        const successCardPyramid = cardDeckCreatedByUser.buildSuccessPyramid();
    
        const successChipPyramid = Composites.pyramid(600, -50, 12, 13, 0, 0, function(x, y) {
            return Bodies.circle(x, y, 10, {
                restitution: 1.4,
                render: {
                    sprite: {
                      texture: chips[getRandomInt(chips.length)],
                      xScale: .12,
                      yScale: .12
                    },
                    torque: 2
                }
            });
        });


        const wallTop = Bodies.rectangle(window.innerWidth/2, -300, window.innerWidth, 600, {
            isStatic: true,
            render: {
                fillStyle: '#111827'
            }
        }),
        wallBottom =Bodies.rectangle(window.innerWidth/2, window.innerHeight+200, window.innerWidth, 600, {
            isStatic: true,
            render: {
                fillStyle: '#111827'
            }
        }),
        wallRight = Bodies.rectangle(window.innerWidth+280, window.innerHeight-100, 600, window.innerHeight, {
            isStatic: true,
            render: {
                fillStyle: '#111827'
            }
        }),
        wallLeft = Bodies.rectangle(-280, window.innerHeight-100, 600, window.innerHeight, {
            isStatic: true,
            render: {
                fillStyle: '#111827'
            }
        });
    
        World.add(engine.world, [wallTop, wallBottom, wallLeft, wallRight]);
        World.add(engine.world, [successCardPyramid, successChipPyramid]);

    }

    let selectedIndexSize = "small";
    let selectedCardBack = "blue";

    const startButton = document.querySelector('#start'),
          indexIndicator = document.querySelector('#index-indicator'),
          smallIndex = document.querySelector('#small-index'),
          largeIndex = document.querySelector('#large-index'),
          blue = document.querySelector('#blue'),
          red = document.querySelector('#red'),
          cactus = document.querySelector('#cactus'),
          coyote = document.querySelector('#coyote'),
          diamonds = document.querySelector('#diamonds'),
          galexy = document.querySelector('#galexy'),
          smiley = document.querySelector('#smiley'),
          beach = document.querySelector('#beach'),
          cardBacks = [ blue, red, cactus, coyote, diamonds, galexy, smiley, beach ]

    for(let i=0; i<cardBacks.length; i++){
        cardBacks[i].addEventListener('click', () => {
            document.querySelector(`#${selectedCardBack}`).classList.remove('bg-green-300');
            cardBacks[i].classList.add('bg-green-300');
            selectedCardBack = cardBacks[i].id
        });
    }

    smallIndex.addEventListener('click', () => {
        indexIndicator.classList.remove('translate-x-12');
        smallIndex.classList.remove('cursor-pointer');
        largeIndex.classList.add('cursor-pointer');
        selectedIndexSize = "small"
    });

    largeIndex.addEventListener('click', () => {
        indexIndicator.classList.add('translate-x-12');
        largeIndex.classList.remove('cursor-pointer');
        smallIndex.classList.add('cursor-pointer');
        selectedIndexSize = "large"
    });

    startButton.addEventListener('click', () => {

        const modalStyles = document.querySelector('#modal').classList
        startButton.classList.add('animate-spin');
        modalStyles.add('opacity-0');

        const gameCards = buildAllCardSvgPaths( selectedIndexSize, selectedCardBack )
        cardDeckCreatedByUser = new CardDeck(gameCards),
        gamePyramid = cardDeckCreatedByUser.buildGamePyramid();
        cardsInPlay = gamePyramid.bodies,
        currentCards = [...cardsInPlay];

        addMatterBodiesToSceneAndStartGame()

        setTimeout( () => { 
            modalStyles.add('hidden');
        }, 500);
    });


})();
