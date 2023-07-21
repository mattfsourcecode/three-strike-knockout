/**
 *  🃏 Three-strike Knockout 🎉
 *  by Matt Fagan @matt-dev-work 12-09-2020
 *  Contact: matt.dev.work@gmail.com
 */

import $ from "jquery";
import Matter from "matter-js";

(() => {
  if (!navigator.isCompatible) {
    return $("#spinner-container-inner").html(
      `<h2 class="header"><div class="mb-10">This browser or device is not compatible yet.</div><div class="mb-10">Please use Chrome or Opera on a computer to enjoy</div><div class="mb-10">🃏 Three-strike Knockout 🎉.</div></h2>`
    );
  }

  const Engine = Matter.Engine,
    Render = Matter.Render,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Composites = Matter.Composites,
    Constraint = Matter.Constraint,
    Events = Matter.Events,
    Composite = Matter.Composite,
    engine = Engine.create(),
    cardCategory = 0x0001, //Matter.js Bodies with the 'cardCategory' collisionFilter category (i.e. cards, walls, airbound chips, ground) can collide with cards.
    chipCategory = 0x0002, //Matter.js Bodies with the 'chipCategory' collisionFilter category (i.e. chips attached to slingshot and the fixed slingshot chip in the "success celebration" view) can collide with the mouse.
    cardBodyRemovalDelayTime = 4000, //Milliseconds for the setTimeout() method in the 'afterUpdate' loop that determines when to remove cards from the World after they fall off.
    chipCoordinateX = 200, //Fixed X coordinate position for the chip slingshot.
    chipCoordinateY = 300, //Fixed Y coordinate position for the chip slingshot.
    chipScale = 0.25, //Size of the chip used in the slingshot.
    xAxisThreshold = 1050, //X axis coordinate threshold that constitutes if a card or chip has fallen off.
    yAxisThreshold = 500, //Y axis coordinate threshold that constitutes if a card or chip has fallen off.
    chipSVGPaths = [], //Array of all chip .svg file paths used for sourcing the slingshot chips using the random indices in the shuffledIndicesForChips array.
    numberOfCardsInGame = 25, //Total number of cards in the game. Used in the shuffle() method to determine what index to slice to.
    totalCards = Array.from(Array(52).keys()), //Array of consecutive integers equaling the total number of unique card files that could potentially be used in the game.
    numberOfChipAttempts = 3, //Total number of chips in the game. Used in the shuffle method to determine what index to slice to.
    totalChips = Array.from(Array(20).keys()), //Array of consecutive integers equaling the total number of unique chip files that could potentially be used in the game.
    cardImages = [
      "blue",
      "red",
      "cactus",
      "canyon",
      "crystals",
      "galaxy",
      "smiley",
      "beach",
    ], //Array of card image names corresponding with the .png file names.
    cardBacks = [], //Array of card image container HTML elements.
    indexSizeOptions = ["small", "large"], //Index size options that correspond to the file paths for the SVG cards.
    topGap = window.innerHeight - window.innerHeight * 0.87,
    getRandomInteger = (max) => {
      return Math.floor(Math.random() * Math.floor(max));
    }; //Returns a random integer within the range of zero to the value of the 'max' argument.

  let render, //Matter.js Render object.
    mouse, //Matter.js Mouse object.
    mouseConstraint, //Matter.js MouseConstraint object.
    chip, //The chip on the slingshot that is ready to be launched.
    elastic, //The Matter.Composite Body linking the chip to the anchor. When the user launches the chip, elastic.BodyB is set to the new chip.
    ground, //The static rectangle Body that the card pyramids land on.
    perimeterWalls, // An array containing four rectangular static bodies used as walls in the "success celebration" view.
    jesterHat, // The jester hat SVG that attaches to elastic when the game is won.
    launchedChip, //The launched chip is set to this variable so that the collisionFilter can be changed after launch.
    airboundChipCoordinateX, //X coordinate of the launched chip (updated in the 'afterUpdate' loop).
    airboundChipCoordinateY, //Y coordinate of the launched chip (updated in the 'afterUpdate' loop).
    chipCoordinateTimeoutHasStarted, //Enables a single invocation of a setTimeout() method in the 'afterUpdate' loop to determinine if there is a game win within 3 seconds if the third chip lands on the ground and stops moving.
    emptyChipArrayTimeoutHasStarted, //Enables a single invocation of a setTimeout() method in the 'afterUpdate' loop to determine if the last chip has fallen off the ground. If the game is not won within 3 seconds, then the game is over.
    gameWon, //Sets to true if the game has been won.
    gameOver, //Sets to true if the game is over.
    shuffledIndicesForCards, //An array of random integers determining which indices to use from the this.cards array in the buildAllCardSvgPaths() method.
    shuffledIndicesForChips, //An array of random integers determining which indices to use from the chipSVGPaths array for the three chips on the slingshot.
    shuffledIndicesForCardsInSuccessPyramid, //A randomized version of the totalCards consecutive integers array determining which indices to use from the this.cards array in the buildSuccessPyramid() method.
    initializedCardDeck, //The constructed CardDeck class.
    gamePyramid, //The Matter.Composite Body returned from the initializedCardDeck.buildGamePyramid() method.
    cardsInPlay, //The card Body objects that comprise the gamePyramid.
    currentCards, //A shallow copy of the cardsInPlay array, of which cards are spliced out as they fall out of play. The game has been won when this array is emptied.
    eventLoopCanEvaluate, //Determines if the conditions within the 'afterUpdate' loop can evaluate or if the loop shall return immediately.
    winningStreak = 0, //The number of consecutive wins per browser session.
    selectedCardBack = "blue", //User selection for the "card back" value in the modal UI.
    selectedIndexSize = "small", //User selection for the "index size" value in the modal UI.
    cardsAreTransparent = false, //User selection for the "transparant" value in the modal UI.
    cardsAreLarger = false; //User selection for the "card size" value in the modal UI.

  /**
   * Declares the render, mouse and mouseConstraint objects which must be declared in conjunction with one another. Then runs the engine and render.
   * This method must invoke after the loading spinner animation to ensure that the $('#matter') element is recognizable.
   */
  const initializeMatter = () => {
    render = Render.create({
      element: $("#matter")[0],
      engine: engine,
      options: {
        wireframes: false,
        pixelRatio: 2, //Resolution of svg elements.
        height:
          window.innerHeight -
          parseInt(window.getComputedStyle($("#app-bar")[0]).height, 10) -
          32, //Calculates the height of the Matter.js render. TODO: This method could potentially be reevaluated.
        width: window.innerWidth,
        background: "#111827",
      },
    });
    mouse = Matter.Mouse.create(render.canvas);
    mouseConstraint = Matter.MouseConstraint.create(engine, { mouse: mouse });
    mouseConstraint.collisionFilter.mask = chipCategory; //The mouse can only interact with objects in the chipCategory.
    render.mouse = mouse;
    Matter.Runner.run(engine);
    Render.run(render);
  };

  /**
   * Adjusts the height and width property of the new-browser-session loading spinner to start the transition.
   * Then removes the spinner from the DOM and removes the "hidden" class from the <main/> element.
   */
  (() => {
    setTimeout(() => {
      $("#spinner").toggleClass("h-1 w-1 h-80 w-80");
    }, 350);
    setTimeout(() => {
      $("main").toggleClass("hidden");
      $("#spinner-container-outer").remove();
      initializeMatter();
    }, 750);
  })();

  /**
   * Builds an array of all chip svg file paths that will be used for sourcing the game chips with three random indices.
   */
  (() => {
    const chipColors = ["blue", "gray", "green", "red"];
    for (let n = 0; n < 5; n++) {
      for (let c = 0; c < chipColors.length; c++) {
        const color = chipColors[c];
        chipSVGPaths.push(`assets/chips/chip-${n}-${color}.svg`);
      }
    }
  })();

  /**
   * Shuffles an array and slices to a specified index.
   * The returned array is compared against an array of card or chip file paths to select the assets to use in the game.
   * @param {array} arr - An array of consecutive integers representing each index.
   * @param {number} total - The index that the output will be sliced to.
   * @return {array} The passed-in 'arr' array, shuffled and sliced to a specified index.
   */
  const shuffle = (arr, total) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1)); //Random integer such that 0 ≤ j ≤ i.
      [arr[i], arr[j]] = [arr[j], arr[i]]; //Switches the i index with the j index.
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
   */
  class CardDeck {
    constructor(indexSize, backImage, transparent, larger) {
      this.indexSize = indexSize;
      this.backImage = `assets/card-backs/${backImage}.png`;
      this.transparent = transparent;
      this.larger = larger;
      this.cards = [];
    }
    /**
     * Builds an array of file paths to the card svg and back image files. File paths have a 1/4 chance of being a back image.
     */
    buildAllCardSvgPaths() {
      const { indexSize, backImage, transparent, larger } = this;
      const cards = [],
        suits = ["C", "D", "H", "S"],
        values = [
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
          "A",
        ];
      for (let s = 0; s < suits.length; s++) {
        const suit = suits[s];
        for (let v = 0; v < values.length; v++) {
          if (getRandomInteger(4) === 3) {
            cards.push(backImage);
          } else {
            const value = values[v];
            cards.push(`assets/cards-${indexSize}-index/${suit}${value}.svg`);
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
    /**
     * Builds the Matter.Composite pyramid for the game using card svg files from this.cards as sprites.
     */
    buildGamePyramid() {
      const { height, width, xScale, yScale, opacity } = this;
      return Composites.pyramid(
        625,
        0,
        9,
        10,
        0,
        0,
        function (x, y) {
          const cardIndex = shuffledIndicesForCards[0];
          shuffledIndicesForCards.shift();
          return Bodies.rectangle(x, y, width, height, {
            collisionFilter: {
              category: cardCategory,
              mask: cardCategory,
            },
            render: {
              opacity: opacity,
              sprite: {
                texture: this.cards[cardIndex],
                xScale: xScale,
                yScale: yScale,
              },
            },
          });
        }.bind(this)
      );
    }
    /**
     * Builds the Matter.Composite pyramid for the "success celebration" view using card svg files from this.cards as sprites.
     */
    buildSuccessPyramid() {
      const { height, width, xScale, yScale, opacity, backImage, larger } =
        this;
      return Composites.pyramid(
        0.33 * window.innerWidth,
        -200,
        14,
        15,
        0,
        0,
        function (x, y) {
          const cardIndex = shuffledIndicesForCardsInSuccessPyramid[0];
          shuffledIndicesForCardsInSuccessPyramid.shift();
          return Bodies.rectangle(x, y, width, height, {
            restitution: larger ? 1.4 : 1.55,
            collisionFilter: {
              category: cardCategory,
              mask: cardCategory | chipCategory,
            },
            render: {
              opacity: opacity,
              sprite: {
                texture: this.cards[cardIndex] || backImage,
                xScale: xScale,
                yScale: yScale,
              },
              torque: 3,
            },
          });
        }.bind(this)
      );
    }
  }

  /**
     Called on click of the start button. This runs the Matter.js Engine and Render, and then adds Body objects to the World. 
     The gamePyramid is built with the CardDeck.prototype.buildGamePyramid() method according to user-specified parameters.
     */
  const addMatterBodiesToWorldAndStartGame = () => {
    (chip = Bodies.circle(chipCoordinateX, chipCoordinateY, 20, {
      density: 0.05,
      collisionFilter: {
        category: chipCategory,
      },
      render: {
        sprite: {
          texture: chipSVGPaths[shuffledIndicesForChips[0]],
          xScale: chipScale,
          yScale: chipScale,
        },
      },
    })),
      (elastic = Constraint.create({
        pointA: { x: chipCoordinateX, y: chipCoordinateY },
        bodyB: chip,
        stiffness: 0.1,
      }));

    (ground = Bodies.rectangle(800, 300, 500, 20, {
      isStatic: true,
      collisionFilter: {
        category: cardCategory,
      },
      render: {
        fillStyle: "#065F46",
      },
    })),
      (jesterHat = Bodies.circle(chipCoordinateX, chipCoordinateY, 80, {
        collisionFilter: {
          category: cardCategory,
        },
        render: {
          sprite: {
            texture: "assets/chips/jester-hat.svg",
            xScale: 0.2,
            yScale: 0.2,
          },
        },
      }));

    perimeterWalls = [
      {
        type: "top",
        x: window.innerWidth / 2,
        y: -300,
        width: window.innerWidth,
        height: 600,
      },
      {
        type: "bottom",
        x: window.innerWidth / 2,
        y: window.innerHeight + 220,
        width: window.innerWidth * 2,
        height: 600,
      },
      {
        type: "right",
        x: window.innerWidth + 300,
        y: window.innerHeight - topGap,
        width: 600,
        height: window.innerHeight,
      },
      {
        type: "left",
        x: -300,
        y: window.innerHeight - topGap,
        width: 600,
        height: window.innerHeight,
      },
    ].map((wall) => {
      return Bodies.rectangle(wall.x, wall.y, wall.width, wall.height, {
        isStatic: true,
        collisionFilter: {
          category: cardCategory,
        },
        render: {
          fillStyle: "#111827",
        },
      });
    });

    initializedCardDeck = new CardDeck(
      selectedIndexSize,
      selectedCardBack,
      cardsAreTransparent,
      cardsAreLarger
    );
    initializedCardDeck.buildAllCardSvgPaths();
    gamePyramid = initializedCardDeck.buildGamePyramid();

    cardsInPlay = gamePyramid.bodies;
    currentCards = [...cardsInPlay];

    World.add(engine.world, [ground, chip, elastic, mouseConstraint]);
    World.add(engine.world, [gamePyramid]);

    eventLoopCanEvaluate = true;
  };

  /**
     The 'afterUpdate' loop is evaluated after engine update and all collision events.
     This loop is being used to evaluate if certain conditions have been met in order to detect game win, a game over, cards calling off, chips being used, etc.
     */
  Events.on(engine, "afterUpdate", () => {
    if (!eventLoopCanEvaluate || gameWon || gameOver) {
      return;
    }

    //Uses the existing cards to determine if a card has been knocked off or if the game has been won.
    if (currentCards.length) {
      for (let i = 0; i < cardsInPlay.length; i++) {
        let body = cardsInPlay[i];
        if (
          body.position.y > yAxisThreshold ||
          body.position.x > xAxisThreshold
        ) {
          //The currentCards array (shallow copy of cardsInPlay) is mutated so that cardsInPlay can be looped through in entirety.
          currentCards.splice(currentCards.indexOf(cardsInPlay[i]), 1);
          //Remove the card Body.
          setTimeout(() => {
            //If the game has been won, remove the card body from the Matter world.
            if (!gameWon) {
              Composite.remove(gamePyramid, body);
              //Otherwise, the card body will remain in the viewport during the "success celebration" view to update the collisionFilter mask to enable collision between the card body and the chip body that remains in the viewport.
            } else {
              body.collisionFilter.mask = cardCategory | chipCategory;
            }
          }, cardBodyRemovalDelayTime);
        }
      }
      //Update cardsInPlay with the cards that remain at the end of the loop.
      cardsInPlay = currentCards;
    } else {
      gameWon = true;
      startSuccessAnimation();
    }

    //Check if the last chip has been launched.
    if (!shuffledIndicesForChips.length) {
      if (
        !emptyChipArrayTimeoutHasStarted &&
        (engine.world.bodies[3].position.x > xAxisThreshold ||
          engine.world.bodies[3].position.y > yAxisThreshold)
      ) {
        emptyChipArrayTimeoutHasStarted = true;
        setTimeout(() => {
          if (!gameWon) {
            gameOver = true;
            handleGameOver();
          }
        }, 2000);
        //Check if the last chip becomes still after launch (i.e. it has landed on the surface). If so, run a setTimeout() to end the game if it has not been won within the number of milliseconds specified in the setTimeout().
      } else if (
        parseInt(airboundChipCoordinateX) !==
          parseInt(engine.world.bodies[3].position.x) ||
        parseInt(airboundChipCoordinateY) !==
          parseInt(engine.world.bodies[3].position.y)
      ) {
        airboundChipCoordinateX = engine.world.bodies[3].position.x;
        airboundChipCoordinateY = engine.world.bodies[3].position.y;
        return;
        //If the chip has not moved and this condition has not yet been met, then start the setTimeout() that ends the game.
      } else if (!chipCoordinateTimeoutHasStarted) {
        chipCoordinateTimeoutHasStarted = true;
        setTimeout(() => {
          if (!gameWon) {
            gameOver = true;
            handleGameOver();
          }
        }, 3000);
      }
    } else {
      //Adds new chip if a chip has been used.
      if (
        mouseConstraint.mouse.button === -1 &&
        (chip.position.x > chipCoordinateX + 20 ||
          chip.position.y < chipCoordinateY - 20)
      ) {
        chip.collisionFilter.category = cardCategory;
        launchedChip = chip;
        shuffledIndicesForChips.shift();
        if (shuffledIndicesForChips.length) {
          chip = Bodies.circle(chipCoordinateX, chipCoordinateY, 20, {
            density: 0.4,
            collisionFilter: {
              category: chipCategory,
            },
            render: {
              sprite: {
                texture: chipSVGPaths[shuffledIndicesForChips[0]],
                xScale: chipScale,
                yScale: chipScale,
              },
            },
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
     */
  const startSuccessAnimation = () => {
    winningStreak++;
    $("#winning-streak").html(`Winning streak: ${winningStreak}`);

    World.remove(engine.world, [ground, chip]); //Remove the ground and the last (tiny / non-visible) chip that was attached to the elastic.
    World.add(engine.world, jesterHat);

    elastic.bodyB = jesterHat;

    launchedChip.collisionFilter.category = chipCategory; //Switch the launchedChip collisionFilter category back to chipCategory to allow the mouse to interact with it.

    const successCardPyramid = initializedCardDeck.buildSuccessPyramid();

    let chipPyramidX = 0.33 * window.innerWidth + 50; //X-axis coordinate for chip pyramid
    if (cardsAreLarger) chipPyramidX += 100;

    const successChipPyramid = Composites.pyramid(
      chipPyramidX,
      -50,
      12,
      13,
      0,
      0,
      (x, y) => {
        return Bodies.circle(x, y, 10, {
          restitution: 1.1,
          collisionFilter: {
            category: cardCategory,
          },
          render: {
            sprite: {
              texture: chipSVGPaths[getRandomInteger(chipSVGPaths.length)],
              xScale: 0.12,
              yScale: 0.12,
            },
            torque: 3,
          },
        });
      }
    );

    World.add(engine.world, perimeterWalls);
    World.add(engine.world, [successChipPyramid, successCardPyramid]);

    setTimeout(() => {
      $("#play-again-button").toggleClass("hidden");
    }, 10000);

    return;
  };

  /**
     When the start button is clicked, the button becomes disabled, gameWon and gameOver are initialized, card and chip indices are shuffled, and a modal transition occurs.
     */
  const handleStartButtonClick = () => {
    $("#start-button").attr("disabled", true);

    gameWon = false;
    gameOver = false;

    shuffledIndicesForCards = shuffle(totalCards, numberOfCardsInGame);
    shuffledIndicesForChips = shuffle(totalChips, numberOfChipAttempts);
    shuffledIndicesForCardsInSuccessPyramid = shuffle(totalCards);

    $("#start-button").toggleClass("animate-spin");
    $("#modal").removeClass("opacity-100");
    $("#modal").addClass("opacity-0");

    setTimeout(() => {
      $("#modal").toggleClass("hidden");
      addMatterBodiesToWorldAndStartGame();
    }, 750);
  };

  /**
   * Dynamically appends all cardImages to the DOM as card selection options, builds the cardBacks array consisting of the respective filepaths, and adds click event listeners for selecting a card back.
   */
  (() => {
    const handleCardBackClick = (element) => {
      $(`#${selectedCardBack}`).toggleClass("bg-green-400");
      element.toggleClass("bg-green-400");
      selectedCardBack = element.attr("id");
    };

    $(
      `<div id="${cardImages[0]}" class="card-selector bg-green-400"><img class="no-drag" src="assets/card-backs/${cardImages[0]}.png"></div>`
    ).appendTo("#card-back-options");
    $(`#${cardImages[0]}`).click(() => {
      handleCardBackClick($(`#${cardImages[0]}`));
    });
    cardBacks.push($(`#${cardImages[0]}`));

    for (let i = 1; i < cardImages.length; i++) {
      $(
        `<div id="${cardImages[i]}" class="card-selector"><img class="no-drag" src="assets/card-backs/${cardImages[i]}.png"></div>`
      ).appendTo("#card-back-options");
      $(`#${cardImages[i]}`).click(() => {
        handleCardBackClick($(`#${cardImages[i]}`));
      });
      cardBacks.push($(`#${cardImages[i]}`));
    }
  })();

  /**
    Apply event listeners to the UI components in the modal.
    */
  (() => {
    $("#transparent").click(() => {
      const element = $("#transparency-container");
      element.toggleClass("opacity-100 opacity-30");
      cardsAreTransparent = !cardsAreTransparent;
    });

    const applyToggleIndexEventListener = (sizes) => {
      for (let i = 0; i < sizes.length; i++) {
        const size = sizes[i];
        $(`#${size}-index`).click(() => {
          const classes = "cursor-pointer text-green-400 text-gray-800";
          $("#small-index").toggleClass(classes);
          $("#large-index").toggleClass(classes);
          $("#index-indicator").toggleClass("translate-x-11");
          selectedIndexSize = indexSizeOptions.find(
            (i) => i !== selectedIndexSize
          );
        });
      }
    };
    applyToggleIndexEventListener(indexSizeOptions);

    $("#card-size").click(() => {
      const element = $("#card-size-container");
      element.toggleClass("h-5 w-4 h-11 w-8");
      cardsAreLarger = !cardsAreLarger;
    });

    $("#play-again-button").click(() => {
      $("#play-again-button").toggleClass("hidden");
      openModalAndReset();
    });

    $("#start-button").click(() => {
      handleStartButtonClick();
    });

    $(document).keypress((e) => {
      e.keyCode == 13 &&
        !$("#start-button").attr("disabled") &&
        handleStartButtonClick();
    });

    $(document).mousedown((e) => {
      $("#matter").removeClass("cursor-grab");
      $("#matter").addClass("cursor-grabbing");
    });
    $(document).mouseup((e) => {
      $("#matter").removeClass("cursor-grabbing");
      $("#matter").addClass("cursor-grab");
    });
  })();

  /**
    Animation that runs when a "Game Over" is determined in the "afterUpdate" loop.
    */
  const handleGameOver = () => {
    $("#game-over-container").toggleClass("hidden");
    setTimeout(() => {
      $("#game-over-container").toggleClass("animate-ping animate-spin");
      setTimeout(() => {
        openModalAndReset();
        $("#game-over-container").toggleClass(
          "hidden animate-ping animate-spin"
        );
        $("#winning-streak").html(``);
        winningStreak = 0;
      }, 500);
    }, 2000);
  };

  /**
    Initializes a new game.
    */
  const openModalAndReset = () => {
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
