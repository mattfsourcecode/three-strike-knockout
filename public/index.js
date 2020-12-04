let Engine = Matter.Engine,
Render = Matter.Render,
World = Matter.World,
Bodies = Matter.Bodies,
Composites = Matter.Composites;
let engine = Engine.create();
let render = Render.create({
    element: document.querySelector('#matter'),
    engine: engine
});
Engine.run(engine);
Render.run(render);

let ball=Bodies.circle(200, 10, 40);
let floor=Bodies.trapezoid(340,300,500,100,.9,{isStatic: true});
let myCar=Composites.car(390, 0, 100, 30, 40);
let myCradle=Composites.newtonsCradle(600, 100, 5, 10, 160);
World.add(engine.world, [ball,floor,myCar,myCradle]);

let world = engine.world;
let Mouse= Matter.Mouse;
let MouseConstraint=Matter.MouseConstraint;
let mouse = Mouse.create(render.canvas);
let mouseConstraint = MouseConstraint.create(engine, {mouse: mouse});
World.add(world, mouseConstraint);
render.mouse = mouse;