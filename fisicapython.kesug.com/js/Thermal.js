// window.onload = function () {
//     let ctx = document.getElementById("C").getContext("2d");
//     let w, h;

//     function fitCanvas() {
//         w = ctx.canvas.width = window.innerWidth;
//         h = ctx.canvas.height = window.innerHeight;
//     }

//     function draw() {
//         ctx.clearRect(0, 0, w, h);
//         // Additional drawing logic can be added here
//     }

//     function loop() {
//         fitCanvas();
//         draw();
//         window.requestAnimationFrame(loop);
//     }

//     window.requestAnimationFrame(loop);
// };

window.onload = function () {
    let ctx = document.getElementById("C").getContext("2d");
    let w, h;

    function fitCanvas() {
        w = ctx.canvas.width = window.innerWidth;
        h = ctx.canvas.height = window.innerHeight;
    }

    function draw() {
        ctx.clearRect(0, 0, w, h);
        // Example: Draw a gradient to represent heat
        let gradient = ctx.createLinearGradient(0, 0, w, h);
        gradient.addColorStop(0, 'blue'); // Cool
        gradient.addColorStop(1, 'red');  // Hot
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
    }

    function loop() {
        fitCanvas();
        draw();
        window.requestAnimationFrame(loop);
    }

    window.requestAnimationFrame(loop);
};

//ME ajuda porfavorrrrr aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa