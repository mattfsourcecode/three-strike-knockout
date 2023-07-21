/**
 *  🃏 Three-strike Knockout 🎉
 *  by Matt Fagan @matt-dev-work 12-09-2020
 *  Contact: matt.dev.work@gmail.com
 */ function _array_like_to_array(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _array_without_holes(arr) {
    if (Array.isArray(arr)) return _array_like_to_array(arr);
}
function _class_call_check(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}
function _defineProperties(target, props) {
    for(var i = 0; i < props.length; i++){
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
    }
}
function _create_class(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
}
function _iterable_to_array(iter) {
    if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
}
function _non_iterable_spread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _to_consumable_array(arr) {
    return _array_without_holes(arr) || _iterable_to_array(arr) || _unsupported_iterable_to_array(arr) || _non_iterable_spread();
}
function _unsupported_iterable_to_array(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _array_like_to_array(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _array_like_to_array(o, minLen);
}
import $ from "jquery";
import Matter from "matter-js";
(function() {
    if (!navigator.isCompatible) {
        return $("#spinner-container-inner").html('<h2 class="header"><div class="mb-10">This browser or device is not compatible yet.</div><div class="mb-10">Please use Chrome or Opera on a computer to enjoy</div><div class="mb-10">\uD83C\uDCCF Three-strike Knockout \uD83C\uDF89.</div></h2>');
    }
    var Engine = Matter.Engine, Render = Matter.Render, World = Matter.World, Bodies = Matter.Bodies, Composites = Matter.Composites, Constraint = Matter.Constraint, Events = Matter.Events, Composite = Matter.Composite, engine = Engine.create(), cardCategory = 0x0001, chipCategory = 0x0002, cardBodyRemovalDelayTime = 4000, chipCoordinateX = 200, chipCoordinateY = 300, chipScale = 0.25, xAxisThreshold = 1050, yAxisThreshold = 500, chipSVGPaths = [], numberOfCardsInGame = 25, totalCards = Array.from(Array(52).keys()), numberOfChipAttempts = 3, totalChips = Array.from(Array(20).keys()), cardImages = [
        "blue",
        "red",
        "cactus",
        "canyon",
        "crystals",
        "galaxy",
        "smiley",
        "beach"
    ], cardBacks = [], indexSizeOptions = [
        "small",
        "large"
    ], topGap = window.innerHeight - window.innerHeight * 0.87, getRandomInteger = function(max) {
        return Math.floor(Math.random() * Math.floor(max));
    }; //Returns a random integer within the range of zero to the value of the 'max' argument.
    var render, mouse, mouseConstraint, chip, elastic, ground, perimeterWalls, jesterHat, launchedChip, airboundChipCoordinateX, airboundChipCoordinateY, chipCoordinateTimeoutHasStarted, emptyChipArrayTimeoutHasStarted, gameWon, gameOver, shuffledIndicesForCards, shuffledIndicesForChips, shuffledIndicesForCardsInSuccessPyramid, initializedCardDeck, gamePyramid, cardsInPlay, currentCards, eventLoopCanEvaluate, winningStreak = 0, selectedCardBack = "blue", selectedIndexSize = "small", cardsAreTransparent = false, cardsAreLarger = false; //User selection for the "card size" value in the modal UI.
    /**
   * Declares the render, mouse and mouseConstraint objects which must be declared in conjunction with one another. Then runs the engine and render.
   * This method must invoke after the loading spinner animation to ensure that the $('#matter') element is recognizable.
   */ var initializeMatter = function() {
        render = Render.create({
            element: $("#matter")[0],
            engine: engine,
            options: {
                wireframes: false,
                pixelRatio: 2,
                height: window.innerHeight - parseInt(window.getComputedStyle($("#app-bar")[0]).height, 10) - 32,
                width: window.innerWidth,
                background: "#111827"
            }
        });
        mouse = Matter.Mouse.create(render.canvas);
        mouseConstraint = Matter.MouseConstraint.create(engine, {
            mouse: mouse
        });
        mouseConstraint.collisionFilter.mask = chipCategory; //The mouse can only interact with objects in the chipCategory.
        render.mouse = mouse;
        Matter.Runner.run(engine);
        Render.run(render);
    };
    /**
   * Adjusts the height and width property of the new-browser-session loading spinner to start the transition.
   * Then removes the spinner from the DOM and removes the "hidden" class from the <main/> element.
   */ (function() {
        setTimeout(function() {
            $("#spinner").toggleClass("h-1 w-1 h-80 w-80");
        }, 350);
        setTimeout(function() {
            $("main").toggleClass("hidden");
            $("#spinner-container-outer").remove();
            initializeMatter();
        }, 750);
    })();
    /**
   * Builds an array of all chip svg file paths that will be used for sourcing the game chips with three random indices.
   */ (function() {
        var chipColors = [
            "blue",
            "gray",
            "green",
            "red"
        ];
        for(var n = 0; n < 5; n++){
            for(var c = 0; c < chipColors.length; c++){
                var color = chipColors[c];
                chipSVGPaths.push("assets/chips/chip-".concat(n, "-").concat(color, ".svg"));
            }
        }
    })();
    /**
   * Shuffles an array and slices to a specified index.
   * The returned array is compared against an array of card or chip file paths to select the assets to use in the game.
   * @param {array} arr - An array of consecutive integers representing each index.
   * @param {number} total - The index that the output will be sliced to.
   * @return {array} The passed-in 'arr' array, shuffled and sliced to a specified index.
   */ var shuffle = function(arr, total) {
        for(var i = arr.length - 1; i > 0; i--){
            var j = Math.floor(Math.random() * (i + 1)); //Random integer such that 0 ≤ j ≤ i.
            var ref;
            ref = [
                arr[j],
                arr[i]
            ], arr[i] = ref[0], arr[j] = ref[1], ref; //Switches the i index with the j index.
        }
        return arr.slice(0, total);
    };
    /**
   * Deck of Cards class
   * @constructor
   * @param {string} indexSize - Interpolated into the front-facing card file paths; The size of the indices on the forward-facing cards.
   * @param {string} backImage - Interpolated into the back-facing card file paths; The name of the image to be used for the card backs.
   * @param {boolean} transparent - Determines if cards are transparent.
   * @param {boolean} larger - Determines if cards are larger.
   */ var CardDeck = /*#__PURE__*/ function() {
        "use strict";
        function CardDeck(indexSize, backImage, transparent, larger) {
            _class_call_check(this, CardDeck);
            this.indexSize = indexSize;
            this.backImage = "assets/card-backs/".concat(backImage, ".png");
            this.transparent = transparent;
            this.larger = larger;
            this.cards = [];
        }
        _create_class(CardDeck, [
            {
                /**
     * Builds an array of file paths to the card svg and back image files. File paths have a 1/4 chance of being a back image.
     */ key: "buildAllCardSvgPaths",
                value: function buildAllCardSvgPaths() {
                    var _this = this, indexSize = _this.indexSize, backImage = _this.backImage, transparent = _this.transparent, larger = _this.larger;
                    var cards = [], suits = [
                        "C",
                        "D",
                        "H",
                        "S"
                    ], values = [
                        "2",
                        "3",
                        "4",
                        "5",
                        "6",
                        "7",
                        "8",
                        "9",
                        "10",
                        "J",
                        "Q",
                        "K",
                        "A"
                    ];
                    for(var s = 0; s < suits.length; s++){
                        var suit = suits[s];
                        for(var v = 0; v < values.length; v++){
                            if (getRandomInteger(4) === 3) {
                                cards.push(backImage);
                            } else {
                                var value = values[v];
                                cards.push("assets/cards-".concat(indexSize, "-index/").concat(suit).concat(value, ".svg"));
                            }
                        }
                    }
                    this.cards = cards;
                    this.height = larger ? 55 : 35;
                    this.width = larger ? 40 : 25;
                    this.xScale = larger ? 0.2 : 0.12;
                    this.yScale = larger ? 0.2 : 0.12;
                    this.opacity = transparent ? 0.5 : 1;
                    return;
                }
            },
            {
                /**
     * Builds the Matter.Composite pyramid for the game using card svg files from this.cards as sprites.
     */ key: "buildGamePyramid",
                value: function buildGamePyramid() {
                    var _this = this, height = _this.height, width = _this.width, xScale = _this.xScale, yScale = _this.yScale, opacity = _this.opacity;
                    return Composites.pyramid(625, 0, 9, 10, 0, 0, (function(x, y) {
                        var cardIndex = shuffledIndicesForCards[0];
                        shuffledIndicesForCards.shift();
                        return Bodies.rectangle(x, y, width, height, {
                            collisionFilter: {
                                category: cardCategory,
                                mask: cardCategory
                            },
                            render: {
                                opacity: opacity,
                                sprite: {
                                    texture: this.cards[cardIndex],
                                    xScale: xScale,
                                    yScale: yScale
                                }
                            }
                        });
                    }).bind(this));
                }
            },
            {
                /**
     * Builds the Matter.Composite pyramid for the "success celebration" view using card svg files from this.cards as sprites.
     */ key: "buildSuccessPyramid",
                value: function buildSuccessPyramid() {
                    var _this = this, height = _this.height, width = _this.width, xScale = _this.xScale, yScale = _this.yScale, opacity = _this.opacity, backImage = _this.backImage, larger = _this.larger;
                    return Composites.pyramid(0.33 * window.innerWidth, -200, 14, 15, 0, 0, (function(x, y) {
                        var cardIndex = shuffledIndicesForCardsInSuccessPyramid[0];
                        shuffledIndicesForCardsInSuccessPyramid.shift();
                        return Bodies.rectangle(x, y, width, height, {
                            restitution: larger ? 1.4 : 1.55,
                            collisionFilter: {
                                category: cardCategory,
                                mask: cardCategory | chipCategory
                            },
                            render: {
                                opacity: opacity,
                                sprite: {
                                    texture: this.cards[cardIndex] || backImage,
                                    xScale: xScale,
                                    yScale: yScale
                                },
                                torque: 3
                            }
                        });
                    }).bind(this));
                }
            }
        ]);
        return CardDeck;
    }();
    /**
     Called on click of the start button. This runs the Matter.js Engine and Render, and then adds Body objects to the World. 
     The gamePyramid is built with the CardDeck.prototype.buildGamePyramid() method according to user-specified parameters.
     */ var addMatterBodiesToWorldAndStartGame = function() {
        chip = Bodies.circle(chipCoordinateX, chipCoordinateY, 20, {
            density: 0.05,
            collisionFilter: {
                category: chipCategory
            },
            render: {
                sprite: {
                    texture: chipSVGPaths[shuffledIndicesForChips[0]],
                    xScale: chipScale,
                    yScale: chipScale
                }
            }
        }), elastic = Constraint.create({
            pointA: {
                x: chipCoordinateX,
                y: chipCoordinateY
            },
            bodyB: chip,
            stiffness: 0.1
        });
        ground = Bodies.rectangle(800, 300, 500, 20, {
            isStatic: true,
            collisionFilter: {
                category: cardCategory
            },
            render: {
                fillStyle: "#065F46"
            }
        }), jesterHat = Bodies.circle(chipCoordinateX, chipCoordinateY, 80, {
            collisionFilter: {
                category: cardCategory
            },
            render: {
                sprite: {
                    texture: "assets/chips/jester-hat.svg",
                    xScale: 0.2,
                    yScale: 0.2
                }
            }
        });
        perimeterWalls = [
            {
                type: "top",
                x: window.innerWidth / 2,
                y: -300,
                width: window.innerWidth,
                height: 600
            },
            {
                type: "bottom",
                x: window.innerWidth / 2,
                y: window.innerHeight + 220,
                width: window.innerWidth * 2,
                height: 600
            },
            {
                type: "right",
                x: window.innerWidth + 300,
                y: window.innerHeight - topGap,
                width: 600,
                height: window.innerHeight
            },
            {
                type: "left",
                x: -300,
                y: window.innerHeight - topGap,
                width: 600,
                height: window.innerHeight
            }
        ].map(function(wall) {
            return Bodies.rectangle(wall.x, wall.y, wall.width, wall.height, {
                isStatic: true,
                collisionFilter: {
                    category: cardCategory
                },
                render: {
                    fillStyle: "#111827"
                }
            });
        });
        initializedCardDeck = new CardDeck(selectedIndexSize, selectedCardBack, cardsAreTransparent, cardsAreLarger);
        initializedCardDeck.buildAllCardSvgPaths();
        gamePyramid = initializedCardDeck.buildGamePyramid();
        cardsInPlay = gamePyramid.bodies;
        currentCards = _to_consumable_array(cardsInPlay);
        World.add(engine.world, [
            ground,
            chip,
            elastic,
            mouseConstraint
        ]);
        World.add(engine.world, [
            gamePyramid
        ]);
        eventLoopCanEvaluate = true;
    };
    /**
     The 'afterUpdate' loop is evaluated after engine update and all collision events.
     This loop is being used to evaluate if certain conditions have been met in order to detect game win, a game over, cards calling off, chips being used, etc.
     */ Events.on(engine, "afterUpdate", function() {
        if (!eventLoopCanEvaluate || gameWon || gameOver) {
            return;
        }
        //Uses the existing cards to determine if a card has been knocked off or if the game has been won.
        if (currentCards.length) {
            var _loop = function(i) {
                var body = cardsInPlay[i];
                if (body.position.y > yAxisThreshold || body.position.x > xAxisThreshold) {
                    //The currentCards array (shallow copy of cardsInPlay) is mutated so that cardsInPlay can be looped through in entirety.
                    currentCards.splice(currentCards.indexOf(cardsInPlay[i]), 1);
                    //Remove the card Body.
                    setTimeout(function() {
                        //If the game has been won, remove the card body from the Matter world.
                        if (!gameWon) {
                            Composite.remove(gamePyramid, body);
                        //Otherwise, the card body will remain in the viewport during the "success celebration" view to update the collisionFilter mask to enable collision between the card body and the chip body that remains in the viewport.
                        } else {
                            body.collisionFilter.mask = cardCategory | chipCategory;
                        }
                    }, cardBodyRemovalDelayTime);
                }
            };
            for(var i = 0; i < cardsInPlay.length; i++)_loop(i);
            //Update cardsInPlay with the cards that remain at the end of the loop.
            cardsInPlay = currentCards;
        } else {
            gameWon = true;
            startSuccessAnimation();
        }
        //Check if the last chip has been launched.
        if (!shuffledIndicesForChips.length) {
            if (!emptyChipArrayTimeoutHasStarted && (engine.world.bodies[3].position.x > xAxisThreshold || engine.world.bodies[3].position.y > yAxisThreshold)) {
                emptyChipArrayTimeoutHasStarted = true;
                setTimeout(function() {
                    if (!gameWon) {
                        gameOver = true;
                        handleGameOver();
                    }
                }, 2000);
            //Check if the last chip becomes still after launch (i.e. it has landed on the surface). If so, run a setTimeout() to end the game if it has not been won within the number of milliseconds specified in the setTimeout().
            } else if (parseInt(airboundChipCoordinateX) !== parseInt(engine.world.bodies[3].position.x) || parseInt(airboundChipCoordinateY) !== parseInt(engine.world.bodies[3].position.y)) {
                airboundChipCoordinateX = engine.world.bodies[3].position.x;
                airboundChipCoordinateY = engine.world.bodies[3].position.y;
                return;
            //If the chip has not moved and this condition has not yet been met, then start the setTimeout() that ends the game.
            } else if (!chipCoordinateTimeoutHasStarted) {
                chipCoordinateTimeoutHasStarted = true;
                setTimeout(function() {
                    if (!gameWon) {
                        gameOver = true;
                        handleGameOver();
                    }
                }, 3000);
            }
        } else {
            //Adds new chip if a chip has been used.
            if (mouseConstraint.mouse.button === -1 && (chip.position.x > chipCoordinateX + 20 || chip.position.y < chipCoordinateY - 20)) {
                chip.collisionFilter.category = cardCategory;
                launchedChip = chip;
                shuffledIndicesForChips.shift();
                if (shuffledIndicesForChips.length) {
                    chip = Bodies.circle(chipCoordinateX, chipCoordinateY, 20, {
                        density: 0.4,
                        collisionFilter: {
                            category: chipCategory
                        },
                        render: {
                            sprite: {
                                texture: chipSVGPaths[shuffledIndicesForChips[0]],
                                xScale: chipScale,
                                yScale: chipScale
                            }
                        }
                    });
                } else {
                    chip = Bodies.circle(chipCoordinateX, chipCoordinateY, 0.01);
                }
                World.add(engine.world, chip);
                elastic.bodyB = chip;
            }
        }
    });
    /**
     Called when conditions are met such that the game has been won.
     Game-related bodies are removed from the World. The "celebration" card and chip pyramids are then instantiated and added to the World. Perimeter walls are also added.
     */ var startSuccessAnimation = function() {
        winningStreak++;
        $("#winning-streak").html("Winning streak: ".concat(winningStreak));
        World.remove(engine.world, [
            ground,
            chip
        ]); //Remove the ground and the last (tiny / non-visible) chip that was attached to the elastic.
        World.add(engine.world, jesterHat);
        elastic.bodyB = jesterHat;
        launchedChip.collisionFilter.category = chipCategory; //Switch the launchedChip collisionFilter category back to chipCategory to allow the mouse to interact with it.
        var successCardPyramid = initializedCardDeck.buildSuccessPyramid();
        var chipPyramidX = 0.33 * window.innerWidth + 50; //X-axis coordinate for chip pyramid
        if (cardsAreLarger) chipPyramidX += 100;
        var successChipPyramid = Composites.pyramid(chipPyramidX, -50, 12, 13, 0, 0, function(x, y) {
            return Bodies.circle(x, y, 10, {
                restitution: 1.1,
                collisionFilter: {
                    category: cardCategory
                },
                render: {
                    sprite: {
                        texture: chipSVGPaths[getRandomInteger(chipSVGPaths.length)],
                        xScale: 0.12,
                        yScale: 0.12
                    },
                    torque: 3
                }
            });
        });
        World.add(engine.world, perimeterWalls);
        World.add(engine.world, [
            successChipPyramid,
            successCardPyramid
        ]);
        setTimeout(function() {
            $("#play-again-button").toggleClass("hidden");
        }, 10000);
        return;
    };
    /**
     When the start button is clicked, the button becomes disabled, gameWon and gameOver are initialized, card and chip indices are shuffled, and a modal transition occurs.
     */ var handleStartButtonClick = function() {
        $("#start-button").attr("disabled", true);
        gameWon = false;
        gameOver = false;
        shuffledIndicesForCards = shuffle(totalCards, numberOfCardsInGame);
        shuffledIndicesForChips = shuffle(totalChips, numberOfChipAttempts);
        shuffledIndicesForCardsInSuccessPyramid = shuffle(totalCards);
        $("#start-button").toggleClass("animate-spin");
        $("#modal").removeClass("opacity-100");
        $("#modal").addClass("opacity-0");
        setTimeout(function() {
            $("#modal").toggleClass("hidden");
            addMatterBodiesToWorldAndStartGame();
        }, 750);
    };
    /**
   * Dynamically appends all cardImages to the DOM as card selection options, builds the cardBacks array consisting of the respective filepaths, and adds click event listeners for selecting a card back.
   */ (function() {
        var _loop = function(i) {
            $('<div id="'.concat(cardImages[i], '" class="card-selector"><img class="no-drag" src="assets/card-backs/').concat(cardImages[i], '.png"></div>')).appendTo("#card-back-options");
            $("#".concat(cardImages[i])).click(function() {
                handleCardBackClick($("#".concat(cardImages[i])));
            });
            cardBacks.push($("#".concat(cardImages[i])));
        };
        var handleCardBackClick = function(element) {
            $("#".concat(selectedCardBack)).toggleClass("bg-green-400");
            element.toggleClass("bg-green-400");
            selectedCardBack = element.attr("id");
        };
        $('<div id="'.concat(cardImages[0], '" class="card-selector bg-green-400"><img class="no-drag" src="assets/card-backs/').concat(cardImages[0], '.png"></div>')).appendTo("#card-back-options");
        $("#".concat(cardImages[0])).click(function() {
            handleCardBackClick($("#".concat(cardImages[0])));
        });
        cardBacks.push($("#".concat(cardImages[0])));
        for(var i = 1; i < cardImages.length; i++)_loop(i);
    })();
    /**
    Apply event listeners to the UI components in the modal.
    */ (function() {
        $("#transparent").click(function() {
            var element = $("#transparency-container");
            element.toggleClass("opacity-100 opacity-30");
            cardsAreTransparent = !cardsAreTransparent;
        });
        var applyToggleIndexEventListener = function(sizes) {
            for(var i = 0; i < sizes.length; i++){
                var size = sizes[i];
                $("#".concat(size, "-index")).click(function() {
                    var classes = "cursor-pointer text-green-400 text-gray-800";
                    $("#small-index").toggleClass(classes);
                    $("#large-index").toggleClass(classes);
                    $("#index-indicator").toggleClass("translate-x-11");
                    selectedIndexSize = indexSizeOptions.find(function(i) {
                        return i !== selectedIndexSize;
                    });
                });
            }
        };
        applyToggleIndexEventListener(indexSizeOptions);
        $("#card-size").click(function() {
            var element = $("#card-size-container");
            element.toggleClass("h-5 w-4 h-11 w-8");
            cardsAreLarger = !cardsAreLarger;
        });
        $("#play-again-button").click(function() {
            $("#play-again-button").toggleClass("hidden");
            openModalAndReset();
        });
        $("#start-button").click(function() {
            handleStartButtonClick();
        });
        $(document).keypress(function(e) {
            e.keyCode == 13 && !$("#start-button").attr("disabled") && handleStartButtonClick();
        });
        $(document).mousedown(function(e) {
            $("#matter").removeClass("cursor-grab");
            $("#matter").addClass("cursor-grabbing");
        });
        $(document).mouseup(function(e) {
            $("#matter").removeClass("cursor-grabbing");
            $("#matter").addClass("cursor-grab");
        });
    })();
    /**
    Animation that runs when a "Game Over" is determined in the "afterUpdate" loop.
    */ var handleGameOver = function() {
        $("#game-over-container").toggleClass("hidden");
        setTimeout(function() {
            $("#game-over-container").toggleClass("animate-ping animate-spin");
            setTimeout(function() {
                openModalAndReset();
                $("#game-over-container").toggleClass("hidden animate-ping animate-spin");
                $("#winning-streak").html("");
                winningStreak = 0;
            }, 500);
        }, 2000);
    };
    /**
    Initializes a new game.
    */ var openModalAndReset = function() {
        eventLoopCanEvaluate = false;
        emptyChipArrayTimeoutHasStarted = false;
        chipCoordinateTimeoutHasStarted = false;
        World.clear(engine.world);
        Engine.clear(engine);
        $("#start-button").attr("disabled", false);
        $("#start-button").toggleClass("animate-spin");
        $("#modal").removeClass("hidden");
        $("#modal").addClass("fixed opacity-100");
    };
})();
