(function() {


    /**
     * Adjusts the height and width property of the spinner to start the transition.
     * Then removes the spinner from the DOM and removes the "hidden" class from the <main/> element.
     */
    (function() {

        const spinner = document.querySelector('#spinner'),
        spinnerContainer = document.querySelector('#spinner-container'),
        main = document.querySelector('main');

        setTimeout(function(){ 
            spinner.classList.remove('h-80');
            spinner.classList.remove('w-80');
            spinner.classList.add('h-1');
            spinner.classList.add('w-1');
        }, 350);

        setTimeout(function(){ 
            main.classList.remove('hidden');
            spinnerContainer.remove();
        }, 750);

    })();


    /**
     * Builds an array of file paths to the card svg and back image files. File paths have a 1/4 change of being a back image.
     * @param {string} indexSize - Interpolated into the front-facing card file paths; The size of the indices on the forward-facing cards.
     * @param {string} backImage - Interpolated into the back-facing card file paths; The name of the image to be used for the card backs.
     * @return {array} An array of file paths to the card svg and back image files.
     */
    const buildAllCardSvgPaths = ( indexSize, backImage ) => {
        const cards = [],
            suits = [ 'C', 'D', 'H', 'S' ],
            values = [ '2', '3', '4', '5', '6', '7', '8', '9', '10', 'A', 'J', 'K', 'Q' ];
        for(let s=0; s<suits.length; s++){
            const suit = suits[s];
            for(let v=0; v<values.length; v++){
                if ( getRandomInt(4) === 3 ) {
                    cards.push(`assets/svg/backs/${backImage}.png`);
                } else {
                    const value = values[v];
                    cards.push(`assets/svg/cards-${indexSize}-index/${suit}${value}.svg`);
                }
            }
        }
        return cards
    }


    //Chip SVG
    const chipColors = [ 'blue', 'gray', 'green', 'red' ];
    const chips = [];
    for(let n=0; n<5; n++){
        for(let c=0; c<chipColors.length; c++){
            const color = chipColors[c];
            chips.push(`assets/svg/chips/chip-${n}-${color}.svg`);
        }
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


    /**
     Set the total number of cards and chips used in the game.
     Then set the total number of card and chip variations that can potentially be used in the game.
     Then pass both variables into shuffledIndexesForCards to produce a random array of indexes
     within the rande of the totalCards/totalChips array, sliced to the numberOfCardsInGame/numberOfChipsInGame index.
    */ 
    const numberOfCardsInGame = 25,
          totalCards = Array.from(Array(52).keys()),
          numberOfChipAttempts = 3,
          totalChips = Array.from(Array(20).keys());

    let shuffledIndexesForCards,
        shuffledIndexesForChips


    /**
     Milliseconds for the setTimeout method in the 'afterUpdate' loop.
     TODO: Variably adjust this number based on window.innerHeight.
    */  
    let cardBodyRemovalDelayTime = 4000

    //Declare Matter.js objects
    let Engine = Matter.Engine,
        Render = Matter.Render,
        World = Matter.World,
        Bodies = Matter.Bodies,
        Composites = Matter.Composites,
        Constraint = Matter.Constraint,
        Events = Matter.Events,
        Composite = Matter.Composite,
        engine = Engine.create(),
        render = Render.create({
            element: document.querySelector('#matter'),
            engine: engine,
            options: {
                wireframes: false,
                pixelRatio: 2, //Resolution of svg elements
                height: window.innerHeight-parseInt(window.getComputedStyle(document.querySelector("#header")).height, 10)+80, //This height calculated method could be re-evaluated
                width: window.innerWidth,
                background: '#111827',
            }
        }),
        cardCategory = 0x0001, // Collision field categories
        chipCategory = 0x0002,
        groundCategory = 0x0003,
        mouse = Matter.Mouse.create(render.canvas),
        mouseConstraint = Matter.MouseConstraint.create(engine, {mouse: mouse}),
        chipCoordinateX = 220, //X coordinate for the picker chip slingshot
        chipCoordinateY = 250, //Y coordinate for the picker chip slingshot
        chipScale = .25, //Size of the picker chip slingshot
        chip,
        launchedChip = null,
        anchor = { x: chipCoordinateX, y: chipCoordinateY },
        elastic,
        ground = Bodies.rectangle(790, 300, 500, 20, { 
            isStatic: true,
            collisionFilter: {
                category: groundCategory,
            },
        }),
        xAxisThreshold = 1050,
        yAxisThreshold = 500,
        gameWon,
        gameOver;

        mouseConstraint.collisionFilter.mask = chipCategory
        render.mouse = mouse;

        Engine.run(engine);
        Render.run(render);


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
                const cardIndex = shuffledIndexesForCards[0]
                shuffledIndexesForCards.shift();
                return Bodies.rectangle(x, y, 25, 35, {
                    collisionFilter: {
                        category: cardCategory,
                        mask: groundCategory | cardCategory,
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
                    collisionFilter: {
                        category: cardCategory,
                        mask: groundCategory | cardCategory | chipCategory
                    },
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
        currentCards,
        eventLoopCanEvaluate;


    /**
     Called on click of the start button. This runs the Matter.js Engine and Render
     and then adds bodies to the scene. The gamePyramid is built with the CardDeck.prototype.buildGamePyramid() method
     according to user-specified parameters.
     */
    const addMatterBodiesToSceneAndStartGame = () => {

        chip = Bodies.circle(chipCoordinateX, chipCoordinateY, 20, {
            density: 0.05,
            collisionFilter: {
                category: chipCategory,
            },
            render: {
                sprite: {
                    texture: chips[shuffledIndexesForChips[0]],
                    xScale: chipScale,
                    yScale: chipScale
                }
            }
        }),

        elastic = Constraint.create({ 
            pointA: anchor, 
            bodyB: chip, 
            stiffness: 0.1,
        });

        const gameCards = buildAllCardSvgPaths( selectedIndexSize, selectedCardBack );
        cardDeckCreatedByUser = new CardDeck(gameCards);
        gamePyramid = cardDeckCreatedByUser.buildGamePyramid();
        cardsInPlay = gamePyramid.bodies;
        currentCards = [...cardsInPlay];

        World.add(engine.world, [ground, chip, elastic, mouseConstraint]);
        World.add(engine.world, [gamePyramid]);

        eventLoopCanEvaluate = true;

    }


    /**
     'afterUpdate' is fired after engine update and all collision events.
     This loop is being used to evaluate if certain conditions have been met,
     in order to detect game win, a game over, cards calling off, chips being used, etc.
     */
    Events.on(engine, 'afterUpdate', function() {


        if ( !eventLoopCanEvaluate || ( gameWon || gameOver )  ) { return }

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

        //Return when shuffledIndexesForChips array has been emptied
        if( !shuffledIndexesForChips.length ){ 
            if(engine.world.bodies[3].position.x > xAxisThreshold || engine.world.bodies[3].position.y > yAxisThreshold){
                gameOver = true;
                openModalAndReset()
            }
            return
         } else {
            //Adds new chip if a chip has been used
            if (mouseConstraint.mouse.button === -1 && (chip.position.x > chipCoordinateX+20 || chip.position.y < chipCoordinateY-20)) {
                chip.collisionFilter.category = cardCategory;
                launchedChip = chip;
                shuffledIndexesForChips.shift();
                if(shuffledIndexesForChips.length){
                    chip = Bodies.circle(chipCoordinateX, chipCoordinateY, 20, {
                        density: 0.4,
                        collisionFilter: {
                            category: chipCategory,
                        },
                        render: {
                            sprite: {
                                texture: chips[shuffledIndexesForChips[0]],
                                xScale: chipScale,
                                yScale: chipScale
                            }
                        }
                    })
                } else {
                    chip = Bodies.circle(chipCoordinateX, chipCoordinateY, .01)
                }
                World.add(engine.world, chip);
                elastic.bodyB = chip;
            };
         }

    });


    const startButton = document.querySelector('#start'),
          modal = document.querySelector('#modal'),
          playAgainButton = document.querySelector('#play-again-button'),
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
          cardBacks = [ blue, red, cactus, coyote, diamonds, galexy, smiley, beach ];


    /**
     Called when conditions are met such that the game has been won.
     Game-related bodies are removed from the scene. The "celebration" card and chip
     pyramids are then instantiated and added to the scene. Border walls are also added.
     */
    const startSuccessAnimation = () => {

        setTimeout( () => { 
            playAgainButton.classList.remove('hidden')
        }, 10000);

        World.remove(engine.world, [ ground ]);

        let hat = Bodies.circle(chipCoordinateX, chipCoordinateY, 80, {
            collisionFilter: {
                category: cardCategory,
            },
            render: {
                sprite: {
                    texture: './assets/svg/chips/jester-hat.svg',
                    xScale: .2,
                    yScale: .2
                }
            }
        })
        World.add(engine.world, hat);
        elastic.bodyB = hat;
        World.remove(engine.world, chip);

        launchedChip.collisionFilter.category = chipCategory;

        const successCardPyramid = cardDeckCreatedByUser.buildSuccessPyramid();
    
        const successChipPyramid = Composites.pyramid(600, -50, 12, 13, 0, 0, function(x, y) {
            return Bodies.circle(x, y, 10, {
                restitution: 1.4,
                collisionFilter: {
                    category: cardCategory,
                },
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
                  collisionFilter: {
                      category: groundCategory,
                  },
                  render: {
                      fillStyle: '#111827'
                  }
              }),
              wallBottom = Bodies.rectangle(window.innerWidth/2, window.innerHeight+220, window.innerWidth, 600, {
                  isStatic: true,
                  collisionFilter: {
                    category: groundCategory,
                },
                  render: {
                      fillStyle: '#111827'
                  }
              }),
              wallRight = Bodies.rectangle(window.innerWidth+300, window.innerHeight-100, 600, window.innerHeight, {
                  isStatic: true,
                  collisionFilter: {
                    category: groundCategory,
                },
                  render: {
                      fillStyle: '#111827'
                  }
              }),
              wallLeft = Bodies.rectangle(-300, window.innerHeight-100, 600, window.innerHeight, {
                  isStatic: true,
                  collisionFilter: {
                    category: groundCategory,
                },
                  render: {
                      fillStyle: '#111827'
                  }
              });
    
        World.add(engine.world, [wallTop, wallBottom, wallLeft, wallRight]);
        World.add(engine.world, [successCardPyramid, successChipPyramid]);

        return

    }

    let selectedIndexSize = "small";
    let selectedCardBack = "blue";

    for(let i=0; i<cardBacks.length; i++){
        cardBacks[i].addEventListener('click', () => {
            document.querySelector(`#${selectedCardBack}`).classList.remove('bg-green-300');
            cardBacks[i].classList.add('bg-green-300');
            selectedCardBack = cardBacks[i].id
        });
    }

    const handleStartButtonClick = () => {

        gameWon = false;
        gameOver = false;

        shuffledIndexesForCards = shuffle(totalCards, numberOfCardsInGame);
        shuffledIndexesForChips = shuffle(totalChips, numberOfChipAttempts);

        startButton.classList.add('animate-spin');
        modal.classList.remove('opacity-100');
        modal.classList.add('opacity-0');

        setTimeout( () => { 
            modal.classList.add('hidden');
            addMatterBodiesToSceneAndStartGame()
        }, 750);

    }

    startButton.addEventListener( 'click', () => { handleStartButtonClick() } );
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

    playAgainButton.addEventListener('click', () => {
        playAgainButton.classList.add('hidden')
        openModalAndReset()
    });

    startButton.addEventListener('click', () => {

        gameWon = false;
        gameOver = false;

        shuffledIndexesForCards = shuffle(totalCards, numberOfCardsInGame);
        shuffledIndexesForChips = shuffle(totalChips, numberOfChipAttempts);

        startButton.classList.add('animate-spin');
        modal.classList.remove('opacity-100');
        modal.classList.add('opacity-0');

        setTimeout( () => { 
            modal.classList.add('hidden');
            addMatterBodiesToSceneAndStartGame()
        }, 750);
    });


    const openModalAndReset = () => {

        eventLoopCanEvaluate = false;

        World.clear(engine.world);
        Engine.clear(engine);

        startButton.classList.remove('animate-spin');
        modal.classList.remove('hidden');
        modal.classList.add('fixed');
        modal.classList.add('opacity-100');

    }

})();
