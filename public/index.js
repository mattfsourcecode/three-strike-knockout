(function() {


    let Engine = Matter.Engine,
        Render = Matter.Render,
        World = Matter.World,
        Bodies = Matter.Bodies,
        Composites = Matter.Composites,
        Constraint = Matter.Constraint,
        Events = Matter.Events,
        Composite = Matter.Composite,
        engine = Engine.create(),
        render,
        cardCategory = 0x0001, // Collision field categories
        chipCategory = 0x0002,
        groundCategory = 0x0003,
        mouse,
        mouseConstraint,
        cardBodyRemovalDelayTime = 4000, // Milliseconds for the setTimeout method determining when in the 'afterUpdate' loop determining when to remove the card after it falls off.
        chipCoordinateX = 220, //X coordinate for the picker chip slingshot
        chipCoordinateY = 250, //Y coordinate for the picker chip slingshot
        airboundChipCoordinateX,
        airboundChipCoordinateY,
        chipCoordinateTimeoutHasStarted,
        emptyChipArrayTimeoutHasStarted,
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


    const initializeMatter = () => {
        render = Render.create({
            element: $('#matter')[0],
            engine: engine,
            options: {
                wireframes: false,
                pixelRatio: 2, //Resolution of svg elements
                height: window.innerHeight-parseInt(window.getComputedStyle($("#header")[0]).height, 10)+98, //This height calculated method could be re-evaluated
                width: window.innerWidth,
                background: '#111827',
            }
        })
        mouse = Matter.Mouse.create(render.canvas)
        mouseConstraint = Matter.MouseConstraint.create(engine, {mouse: mouse})
        mouseConstraint.collisionFilter.mask = chipCategory
        render.mouse = mouse;

        Engine.run(engine);
        Render.run(render);
    }
        

    /**
     * Adjusts the height and width property of the spinner to start the transition.
     * Then removes the spinner from the DOM and removes the "hidden" class from the <main/> element.
     */
    (function() {
        setTimeout(function(){ 
            $('#spinner').removeClass( 'h-80 w-80' );
            $('#spinner').addClass( 'h-1 w-1' );
        }, 350);
        setTimeout(function(){ 
            $('main').removeClass('hidden');
            $('#spinner-container').remove();
            initializeMatter();
        }, 750);
    })();


    //Chip SVG
    const chipColors = [ 'blue', 'gray', 'green', 'red' ];
    const chips = [];
    for(let n=0; n<5; n++){
        for(let c=0; c<chipColors.length; c++){
            const color = chipColors[c];
            chips.push(`assets/chips/chip-${n}-${color}.svg`);
        }
    }


    const getRandomInt = (max) => {
        return Math.floor(Math.random() * Math.floor(max));
    }


    /**
     * Shuffles an array and slices to a specified index. The returned result is compared against
     * an array of card or chip file paths to select the assets to use in the game.
     * @param {array} arr - An array of consecutive integers representing each index.
     * @param {number} total - The index that the output will be sliced to.
     * @return {array} The passed-in arr array, shuffled and sliced to a specified index.
     */
    const shuffle = (arr, total) => {
        for (let i=arr.length-1; i>0; i--) {
            const j = Math.floor(Math.random() * (i + 1)); //random integer such that 0 ≤ j ≤ i.
            [arr[i], arr[j]] = [arr[j], arr[i]]; //switches the i index with the j index.
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
     * Household member JSON
     * @constructor
     * @param {string} indexSize - Interpolated into the front-facing card file paths; The size of the indices on the forward-facing cards.
     * @param {string} backImage - Interpolated into the back-facing card file paths; The name of the image to be used for the card backs.
     * @param {boolean} transparent - Determines if cards are transparent.
     * @param {boolean} larger - Determines if cards are larger.
     */
    class CardDeck {
        constructor(indexSize, backImage, transparent, larger) {
            this.indexSize = indexSize;
            this.backImage = backImage;
            this.transparent = transparent;
            this.larger = larger;
            this.cards = [];
        }
        /**
         * Builds an array of file paths to the card svg and back image files. File paths have a 1/4 change of being a back image.
         * @return {array} An array of file paths to the card svg and back image files.
         */
        buildAllCardSvgPaths() {
            const { backImage, indexSize } = this;
            const cards = [],
                suits = [ 'C', 'D', 'H', 'S' ],
                values = [ '2', '3', '4', '5', '6', '7', '8', '9', '10', 'A', 'J', 'K', 'Q' ];
            for(let s=0; s<suits.length; s++){
                const suit = suits[s];
                for(let v=0; v<values.length; v++){
                    if ( getRandomInt(4) === 3 ) {
                        cards.push(`assets/card-backs/${backImage}.png`);
                    } else {
                        const value = values[v];
                        cards.push(`assets/cards-${indexSize}-index/${suit}${value}.svg`);
                    }
                }
            }
            this.cards = cards;
            return
        }
        buildGamePyramid() {
            const { transparent, larger } = this;
            const height = larger ? 55 : 35,
                  width = larger ? 40 : 25;
            return Composites.pyramid(600, 0, 9, 10, 0, 0, function(x, y) {
                const cardIndex = shuffledIndexesForCards[0]
                shuffledIndexesForCards.shift();
                return Bodies.rectangle(x, y, width, height, {
                    collisionFilter: {
                        category: cardCategory,
                        mask: groundCategory | cardCategory,
                    },
                    render: {
                        opacity: transparent ? .5 : 1,
                        sprite: {
                            texture: this.cards[cardIndex],
                            xScale: larger ? .2 : .12,
                            yScale: larger ? .2 : .12
                        }
                    }
                });
            }.bind(this));
        }
        buildSuccessPyramid() {
            const { transparent, larger } = this;
            return Composites.pyramid(.33*window.innerWidth, -200, 14, 15, 0, 0, function(x, y) {
                return Bodies.rectangle(x, y, 25, 35, {
                    restitution: 1.4,
                    collisionFilter: {
                        category: cardCategory,
                        mask: groundCategory | cardCategory | chipCategory
                    },
                    render: {
                        opacity: transparent ? .5 : 1,
                        sprite: {
                            texture: this.cards[getRandomInt(this.cards.length)],
                            xScale: larger ? .2 : .12,
                            yScale: larger ? .2 : .12
                        },
                        torque: 3
                    }
                });
            }.bind(this));
        }
    }


    let cardDeckInitializer,
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

        cardDeckInitializer = new CardDeck( selectedIndexSize, selectedCardBack, cardsAreTransparent, cardsAreLarger )
        cardDeckInitializer.buildAllCardSvgPaths();
        gamePyramid = cardDeckInitializer.buildGamePyramid();

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
    Events.on(engine, 'afterUpdate', () => {

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
                    setTimeout( () => { 
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
            if( !emptyChipArrayTimeoutHasStarted && (engine.world.bodies[3].position.x > xAxisThreshold || engine.world.bodies[3].position.y > yAxisThreshold) ){
                emptyChipArrayTimeoutHasStarted = true;
                setTimeout( () => {
                    if (!gameWon){
                        gameOver = true;
                        handleGameOver()
                    }
                }, 2000);
            //Check if the last chip has not moved (i.e. it has landed on the surface). If so, set a timeout and then end the game if it has not been won.
            } else if ( ( parseInt(airboundChipCoordinateX) !== parseInt(engine.world.bodies[3].position.x) ) || ( parseInt(airboundChipCoordinateY) !== parseInt(engine.world.bodies[3].position.y) ) ) {
                airboundChipCoordinateX = engine.world.bodies[3].position.x;
                airboundChipCoordinateY = engine.world.bodies[3].position.y;
                return
            } else if (!chipCoordinateTimeoutHasStarted) {
                chipCoordinateTimeoutHasStarted = true
                setTimeout( () => {
                    if (!gameWon){
                        gameOver = true;
                        handleGameOver()
                    }
                }, 3000);
            }
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


    const cardBacks = [ 
        $('#blue'), 
        $('#red'), 
        $('#cactus'), 
        $('#coyote'), 
        $('#diamonds'), 
        $('#galexy'), 
        $('#smiley'), 
        $('#beach')
    ];

    /**
     Called when conditions are met such that the game has been won.
     Game-related bodies are removed from the scene. The "celebration" card and chip
     pyramids are then instantiated and added to the scene. Border walls are also added.
     */
    const startSuccessAnimation = () => {

        setTimeout( () => { 
            $('#play-again-button').removeClass('hidden')
        }, 10000);

        World.remove(engine.world, [ ground ]);

        let hat = Bodies.circle(chipCoordinateX, chipCoordinateY, 80, {
            collisionFilter: {
                category: cardCategory,
            },
            render: {
                sprite: {
                    texture: 'assets/chips/jester-hat.svg',
                    xScale: .2,
                    yScale: .2
                }
            }
        })
        World.add(engine.world, hat);
        elastic.bodyB = hat;
        World.remove(engine.world, chip);

        launchedChip.collisionFilter.category = chipCategory;

        const successCardPyramid = cardDeckInitializer.buildSuccessPyramid();
    
        const successChipPyramid = Composites.pyramid(.33*window.innerWidth+50, -50, 12, 13, 0, 0, function(x, y) {
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
                    torque: 3
                }
            });
        });
        

        let wallParameters = [
            {
                type: 'top',
                x: window.innerWidth/2,
                y: -300,
                width: window.innerWidth,
                height: 600
            },
            {
                type: 'top',
                x: window.innerWidth/2,
                y: window.innerHeight+220,
                width: window.innerWidth,
                height: 600
            },
            {
                type: 'right',
                x: window.innerWidth+300,
                y: window.innerHeight-100,
                width: 600,
                height: window.innerHeight
            },
            {
                type: 'left',
                x: -300,
                y: window.innerHeight-100,
                width: 600,
                height: window.innerHeight
            }
        ]

        wallParameters = wallParameters.map( wall => {
            return Bodies.rectangle( wall.x, wall.y, wall.width, wall.height, {
                isStatic: true,
                collisionFilter: {
                    category: groundCategory,
                },
                render: {
                    fillStyle: '#111827'
                }
            });
        })
    
        World.add(engine.world, wallParameters);
        World.add(engine.world, [successChipPyramid, successCardPyramid]);

        return

    }

    let selectedCardBack = "blue";
    let selectedIndexSize = "small";
    let cardsAreTransparent = false;
    let cardsAreLarger = false;


    for(let i=0; i<cardBacks.length; i++){
        cardBacks[i].click( () => {
            $(`#${selectedCardBack}`).removeClass('bg-green-400');
            cardBacks[i].addClass('bg-green-400');
            selectedCardBack = cardBacks[i].attr('id')
        });
    }

    const handleStartButtonClick = () => {

        $("#start-button").attr("disabled",true);

        gameWon = false;
        gameOver = false;

        shuffledIndexesForCards = shuffle(totalCards, numberOfCardsInGame);
        shuffledIndexesForChips = shuffle(totalChips, numberOfChipAttempts);

        $('#start-button').addClass('animate-spin');
        $('#modal').removeClass('opacity-100');
        $('#modal').addClass('opacity-0');

        setTimeout( () => { 
            $('#modal').addClass('hidden');
            addMatterBodiesToSceneAndStartGame()
        }, 750);

    }

    $('#start-button').click( () => { handleStartButtonClick() } );

    $(document).keypress( (e) => { ( e.keyCode == 13 && !eventLoopCanEvaluate ) && handleStartButtonClick() } );

    $('#transparent').click( () => {
        const element = $('#transparency-container');
        if (cardsAreTransparent) {
            element.removeClass('opacity-30');
            element.addClass('opacity-100');
            cardsAreTransparent = false;
        } else {
            element.removeClass('opacity-100');
            element.addClass('opacity-30');
            cardsAreTransparent = true;
        };
    });

    $('#small-index').click( () => {
        $('#index-indicator').removeClass('translate-x-11');
        $('#small-index').removeClass('cursor-pointer');
        $('#large-index').addClass('cursor-pointer');
        selectedIndexSize = "small"
    });

    $('#large-index').click( () => {
        $('#index-indicator').addClass('translate-x-11');
        $('#large-index').removeClass('cursor-pointer');
        $('#small-index').addClass('cursor-pointer');
        selectedIndexSize = "large"
    });

    $('#play-again-button').click( () => {
        $('#play-again-button').addClass('hidden')
        openModalAndReset()
    });

    $('#card-size').click( () => {
        const element = $('#card-size-container');
        if (cardsAreLarger) {
            element.removeClass('h-11 w-8');
            element.addClass('h-5 w-4');
            cardsAreLarger = false;
        } else {
            element.removeClass('h-5 w-4');
            element.addClass('h-11 w-8');
            cardsAreLarger = true;
        };
    });

    const handleGameOver = () => {
        $('#game-over-container').removeClass('hidden');
        setTimeout(function(){ 
            $('#game-over-text').removeClass('animate-ping');
            $('#game-over-text').addClass('animate-spin');
            setTimeout(function(){ 
                openModalAndReset()
                $('#game-over-container').addClass('hidden');
                $('#game-over-text').removeClass('animate-spin');
                $('#game-over-text').addClass('animate-ping');
            }, 500);
        }, 2000);
    }

    const openModalAndReset = () => {

        eventLoopCanEvaluate = false;
        emptyChipArrayTimeoutHasStarted = false;
        chipCoordinateTimeoutHasStarted = false;

        World.clear(engine.world);
        Engine.clear(engine);

        $("#start-button").attr("disabled",false);
        $('#start-button').removeClass('animate-spin');
        $('#modal').removeClass('hidden');
        $('#modal').addClass('fixed');
        $('#modal').addClass('opacity-100');

    }

})();
