(function() {
    console.log('hello world');
    var colors= {
            a: '#004358',
            b: '#1F8A70',
            c: '#BEDB39',
            d: '#FFE11A',
            e: '#FD7400',
            black: '#000'
        },
        c, // canvas
        ctx, // canvas context
        tickRateMS = (1000 / 60),
        curKeys = {},
        scene = [],
        flarImg,
        explImg,
        bgImg,
        dustImg,
        muted = false,
        muteIcon,
        muteIcons = {
            active: 'res/glyphicons_free/glyphicons/png/glyphicons-185-volume-up.png',
            inactive: 'res/glyphicons_free/glyphicons/png/glyphicons-183-mute.png'
        },
        audio,
        explAudio,
        sounds = {
            explosion: 'res/162792__timgormly__8-bit-explosion1.wav',
            shoot: 'res/215438__taira-komori__shoot02.mp3'
        };

    function main() {
        c = document.getElementById('c');
        ctx = c.getContext('2d');
        resize();
        window.addEventListener('resize', resize);
        window.addEventListener('orientationchange', resize);
        
        document.getElementById('mute').addEventListener('click', muteHandler);
        muteIcon = document.getElementById('mute-icon');
        muteIcon.src = muteIcons.active;

        scene.push(new Ship('res/CE6_spaceship_mer.png'));
        scene.push(new Text([
            'Greetings cadet!',
            'Times are dark for the empire and',
            'the Vymraxxyian threat is near,',
            'we are in need of intrepid pilots',
            'to fight the growing threat.',
            '',
            'Arm your blasters and prepare for BATTLE!']));
        flareImg = new Image();
        flareImg.src = 'res/flare.png';
        bgImg = new Image();
        bgImg.src = 'res/Star-field-3-Desktop-Wallpaper.jpg';
        bgImg.style.filter = "alpha(opacity=40);";
        bgImg.style.opacity = 0.4;

        explImg = new Image();
        explImg.src = 'res/lvxdmali.png';

        dustImg = new Image();
        // dustImg.src = 'res/asfalt-dark.png';
        // dustImg.src = 'res/stock-footage-loopable-old-film-style-overlay-effect-contains-medium-film-grain-scratches-dust-hairs-stains.jpg';
        dustImg.src = 'res/PEnJm.png';
        // watch keys:
        window.addEventListener('keydown', function(e) {
            console.log(e.which);
            curKeys[e.which] = true;
        });
        window.addEventListener('keyup', function(e) {
            console.log(e.which);
            curKeys[e.which] = false;
        });
        // awesome music!
        audio = new Audio('res/The Crucis Fiasco.wav');
        audio.play();

        // start up logic and render loops
        window.requestAnimationFrame(drawLoop);
        stepLoop();
    }

    var Ship = function(src) {
        var img = new Image(),
            rotation = 90,
            shotCooldownMS = 30,
            shotTS = -Infinity,
            x = c.width / 2,
            y = c.height / 2,
            velocity = 4,
            shipLength = 100;

        img.src = src;

        return {
            render: function() {
                if (img) {
                    var imgRatio = img.height / img.width,
                        imgScale = shipLength,
                        imgWidth = imgScale,
                        imgHeight = imgScale * imgRatio;
                    var rotation = this.getRotationRadians();
                    // trans & rotate
                    ctx.translate(x, y);
                    ctx.rotate(rotation);
                    // draw image
                    ctx.drawImage(img, -(imgWidth / 2), -(imgHeight / 2), imgWidth, imgHeight);
                    // trans & rotate back
                    ctx.rotate(-rotation);
                    ctx.translate(-x, -y);
                }
            },
            update: function() {
                if (curKeys[39]) {
                    //right
                    this.rotate(4);
                } else if (curKeys[37]) {
                    // left
                    this.rotate(-4);
                }
                if (curKeys[38] || curKeys[40]) {
                    var magnitude = curKeys[38] ? velocity: -velocity,
                        yFract = Math.sin(this.getRotationRadians()),
                        xFract = Math.cos(this.getRotationRadians());
                    var dY = yFract * magnitude,
                        dX = xFract * magnitude;
                    if (y - dY < 0) {
                        y = c.height - dY;
                    } else if (y - dY > c.height) {
                        y = 0 - dY;
                    } else {
                        y -= yFract * magnitude;
                    }
                    if (x - dX < 0) {
                        x = c.width - dX;
                    } else if (x - dX > c.width) {
                        x = 0 - dX;
                    } else {
                        x -= xFract * magnitude;
                    }
                }
                if (curKeys[32]) {
                    var curTime = Date.now();
                    if (curTime - shotTS > shotCooldownMS) {
                        shotTS = curTime;
                        // console.log('firing');
                        var datY = Math.sin(this.getRotationRadians()),
                            datX = Math.cos(this.getRotationRadians());
                        var vY = datY * velocity,
                            vX = datX * velocity;
                        var pY = y - datY * shipLength / 2,
                            pX = x - datX * shipLength / 2;
                        window.setTimeout(function() {
                            scene.unshift(new Projectile(pX, pY, rotation, vX, vY));
                            var a = new Audio(sounds.shoot);
                            a.play();
                        });
                    }
                }
            },
            rotate: function(r) {
                rotation = (rotation + r) % 360;
                // console.log(rotation);
                // console.log(this.getRotationRadians());
            },
            getRotationRadians: function() {
                return rotation * Math.PI/180;
            }
        };
    };

    var Text = function(datTextYo) {
        var x = 20,
            y = c.height + 10;
        return {
            render: function() {
                ctx.font = 'bold 14pt VT323';
                ctx.fillStyle = "#ff4";
                for (var i = 0; i < datTextYo.length; i++) {
                    var curY = y + (i*30);
                    ctx.fillText(datTextYo[i], x, curY);
                }
                
            }, update: function() {
                y -= 0.5;
            }
        };
    };

    var Projectile = function(startX, startY, startDir, startVX, startVY) {
        var x = startX,
            y = startY,
            rotation = startDir,
            vX = startVX,
            vY = startVY,
            velocity = 10,
            ttl = 60,
            aliveFor = 0;
        return {
            render: function() {
                // ctx.fillStyle = colors.c;
                // ctx.fillRect(x-5, y-5, 10, 10);
                var renderSize = 50,
                    imgX = x - (renderSize / 2),
                    imgY = y - (renderSize / 2);

                var explIdx = ttl - aliveFor;
                if (explIdx <= 20) {
                    var row = Math.floor(explIdx / 5);
                    var sliceSize = 96,
                        sliceX = (explIdx % 5) * 96,
                        sliceY = row * 95;
                    ctx.drawImage(explImg, sliceX, sliceY, sliceSize, sliceSize, imgX, imgY, renderSize, renderSize);
                } else {
                    ctx.drawImage(flareImg, imgX, imgY, renderSize, renderSize);
                }
                // console.log(x);
            },
            update: function() {
                var magnitude = velocity,
                    yFract = Math.sin(this.getRotationRadians()),
                    xFract = Math.cos(this.getRotationRadians());
                // console.log(yFract);
                // y -= (yFract * magnitude) + vY;
                // console.log(y);
                // x -= (xFract * magnitude) + vX;

                if (ttl - aliveFor > 20) {
                    var dY = (yFract * magnitude) + vY,
                        dX = (xFract * magnitude) + vX;
                    if (y - dY < 0) {
                        y = c.height - dY;
                    } else if (y - dY > c.height) {
                        y = 0 - dY;
                    } else {
                        y -= yFract * magnitude;
                    }
                    if (x - dX < 0) {
                        x = c.width - dX;
                    } else if (x - dX > c.width) {
                        x = 0 - dX;
                    } else {
                        x -= xFract * magnitude;
                    }
                } else if (ttl - aliveFor === 20) {
                    var a = new Audio();
                    a.src = sounds.explosion;
                    a.play();
                }
                if (aliveFor > ttl) {
                    window.setTimeout(function() {
                        var myInd = scene.indexOf(this);
                        if (myInd > -1) {
                            scene.splice(myInd, 1);
                        }
                    }.bind(this));
                }
                aliveFor += 1;
            },
            getRotationRadians: function() {
                // console.log(rotation);
                return rotation * Math.PI/180;
            }
        };
    };

    function step() {

        // scene.push({render:function(){},update:function(){}});
        for (var i = 0; i < scene.length; i++) {
            scene[i].update();
        }
    }

    function stepLoop() {
        step();
        var timeout = tickRateMS;
        if (curKeys[80]) {
            timeout = 2000;
        }
        window.setTimeout(stepLoop, timeout);
    }

    function draw() {
        // background
        ctx.drawImage(bgImg, 0, 0, c.width, c.height);
        var offX = (Math.random() * .2) - 5;
        var offY = (Math.random() * .2) - 5;
        ctx.drawImage(bgImg, -10 + offX, -10 + offY, c.width + offX + 20, c.height + offY + 20);
        for (var i = 0; i < scene.length; i++) {
            scene[i].render();
        }
    }

    function drawLoop() {
        draw();
        window.requestAnimationFrame(drawLoop);
    }

    function resize() {
        console.debug('resize');
        c.style.width = window.innerWidth + 'px';
        c.style.height = window.innerHeight + 'px';
        c.width = window.innerWidth / 2;
        c.height = window.innerHeight / 2;
    }

    function muteHandler(e) {
        muted = !muted;
        if (muted) {
            muteIcon.src = muteIcons.inactive;
            audio.volume = 0;
        } else {
            audio.volume = 1;
            muteIcon.src = muteIcons.active;
        }
    }

    document.addEventListener('DOMContentLoaded', function(event) {
        console.debug('DOMContentLoaded');
        main();
    });
})();







