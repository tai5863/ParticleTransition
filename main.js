// wgld.org WebGL2.0 sample.014

(function(){
    'use strict';

    // variables
    let gl, canvas, canvasWidth, canvasHeight, camera;
    let targetImageData0, targetImageData1, imageWidth, imageHeight, run, req;
    let mousePosition;
    let stats = new Stats();
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    const resizeCanvas = function(){
        canvasWidth = window.innerWidth;
        canvasHeight = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    imageWidth = 512;
    imageHeight = 512;

    window.addEventListener('load', function(){

        // canvas initialize
        canvas = document.getElementById('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        mousePosition = [0.0, 0.0];

        // mousemove event
        canvas.addEventListener('mousemove', function(eve){
            let bound = eve.currentTarget.getBoundingClientRect();
            let x = eve.clientX - bound.left;
            let y = eve.clientY - bound.top;
            mousePosition = [
                x / bound.width * 2.0 - 1.0,
                -(y / bound.height * 2.0 - 1.0)
            ];
        }, false);

        // webgl2 initialize
        gl = canvas.getContext('webgl2');
        if(gl){
        }else{
            console.log('webgl2 unsupported');
            return;
        }

        // interaction camera events

        let cPos = {x: 0.0, y: 0.0, z: 0.0};

        const tl = new TimelineMax();

        tl.to(cPos, 5.0, {z: -2.0});

        camera = new InteractionCamera(cPos.z);
        canvas.addEventListener('mousedown', camera.mouseInteractionStart, false);
        canvas.addEventListener('mousemove', camera.mouseInteractionMove, false);
        canvas.addEventListener('mouseup', camera.mouseInteractionEnd, false);

        // generate imagedata
        let img0 = new Image();
        let img1 = new Image();

        let target0 = document.getElementById('file_upload1');
        target0.addEventListener('change', function(e){
            let file = e.target.files[0];
            let reader = new FileReader();
            reader.onload = function(e){
                img0.src = e.target.result;
            }
            reader.readAsDataURL(file);
            cancelAnimationFrame(req);
        }, false);

        let target1 = document.getElementById('file_upload2');
        target1.addEventListener('change', function(e){
            let file = e.target.files[0];
            let reader = new FileReader();
            reader.onload = function(e){
                img1.src = e.target.result;
                image1 = img1.src;
            }
            reader.readAsDataURL(file);
            cancelAnimationFrame(req);
        }, false);

        let onloadFunc = function(){
            let c = document.createElement('canvas');
            let ctx = c.getContext('2d');
            c.width = imageWidth;
            c.height = imageHeight;
            ctx.drawImage(img1, 0, 0, imageWidth, imageHeight);
            targetImageData1 = ctx.getImageData(0, 0, imageWidth, imageHeight);
            init();
        }

        let image1 = 'Texture/Texture02.jpg';

        img0.addEventListener('load', function(){
            let c = document.createElement('canvas');
            let ctx = c.getContext('2d');
            c.width = imageWidth;
            c.height = imageHeight;
            ctx.drawImage(img0, 0, 0, imageWidth, imageHeight);
            targetImageData0 = ctx.getImageData(0, 0, imageWidth, imageHeight);
            img1.removeEventListener('load', onloadFunc);
            img1.addEventListener('load', onloadFunc, false);
            img1.src = image1;
        }, false);
        img0.src = 'Texture/Texture01.jpg';

        function init(){
            // transform feedback object
            let transformFeedback = gl.createTransformFeedback();
            gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transformFeedback);

            // out variable names
            let outVaryings = ['gl_Position', 'vColor', 'vVelocity'];

            // transform out shader
            let vs = create_shader('vs_transformOut');
            let fs = create_shader('fs_transformOut');
            let prg = create_program_tf_separate(vs, fs, outVaryings);
            let attLocation = [];
            attLocation[0] = 0;
            attLocation[1] = 1;
            attLocation[2] = 2;
            attLocation[3] = 3;
            let attStride = [];
            attStride[0] = 4;
            attStride[1] = 4;
            attStride[2] = 4;
            attStride[3] = 4;
            let uniLocation = [];
            uniLocation[0] = gl.getUniformLocation(prg, 'time');
            uniLocation[1] = gl.getUniformLocation(prg, 'mouse');
            uniLocation[2] = gl.getUniformLocation(prg, 'mouse_trans');

            // feedback in shader
            vs = create_shader('vs_feedbackIn');
            fs = create_shader('fs_feedbackIn');
            let fPrg = create_program(vs, fs);
            let fAttLocation = [];
            fAttLocation[0] = 0;
            fAttLocation[1] = 1;
            fAttLocation[2] = 2;
            fAttLocation[3] = 3;
            let fAttStride = [];
            fAttStride[0] = 4;
            fAttStride[1] = 4;
            fAttStride[2] = 4;
            fAttStride[3] = 4;
            let fUniLocation = [];
            fUniLocation[0] = gl.getUniformLocation(fPrg, 'vpMatrix');
            fUniLocation[1] = gl.getUniformLocation(fPrg, 'time');

            // vertices
            let position = [];
            let color0 = [];
            let color1 = [];
            let velocity = [];
            let feedbackPosition = [];
            let feedbackColor0 = [];
            let feedbackColor1 = [];
            let feedbackVelocity = [];
            (function(){
                let i, j, k, l;
                let x, y;
                for(i = 0; i < imageHeight; ++i){
                    y = i / imageHeight * 2.0 - 1.0;
                    k = i * imageWidth;
                    for(j = 0; j < imageWidth; ++j){
                        x = j / imageWidth * 2.0 - 1.0;
                        l = (k + j) * 4
                        position.push(x, -y, 0.0, 1.0);
                        color0.push(
                            targetImageData0.data[l]     / 511,
                            targetImageData0.data[l + 1] / 511,
                            targetImageData0.data[l + 2] / 511,
                            targetImageData0.data[l + 3] / 511
                        );
                        color1.push(
                            targetImageData1.data[l]     / 511,
                            targetImageData1.data[l + 1] / 511,
                            targetImageData1.data[l + 2] / 511,
                            targetImageData1.data[l + 3] / 511
                        );
                        // velocity.push(Math.random(), Math.random(), Math.random(), 0.0);
                        velocity.push(0.0, 0.0, 0.0, 0.0);
                        feedbackPosition.push(0.0, 0.0, 0.0, 0.0);
                        feedbackColor0.push(0.0, 0.0, 0.0, 0.0);
                        feedbackColor1.push(0.0, 0.0, 0.0, 0.0);
                        feedbackVelocity.push(0.0, 0.0, 0.0, 0.0);
                    }
                }
            })();

            let transformOutVBO = [
                create_vbo(position),
                create_vbo(color0),
                create_vbo(color1),
                create_vbo(velocity)
            ];
            let feedbackInVBO = [
                create_vbo_feedback(feedbackPosition),
                create_vbo_feedback(feedbackColor0),
                create_vbo_feedback(feedbackColor1),
                create_vbo_feedback(feedbackVelocity)
            ];

            // matrix
            let mat = new matIV();
            let vMatrix   = mat.identity(mat.create());
            let pMatrix   = mat.identity(mat.create());
            let vpMatrix  = mat.identity(mat.create());

            // flags
            gl.disable(gl.DEPTH_TEST);
            gl.disable(gl.CULL_FACE);
            gl.enable(gl.BLEND);
            gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE);
            gl.disable(gl.RASTERIZER_DISCARD);

            // setting
            let startTime = Date.now();
            let nowTime = 0;
            let container = document.getElementById('container');
            container.appendChild(stats.domElement);

            render();

            function render(){

                camera = new InteractionCamera(cPos.z);

                stats.update();

                req = requestAnimationFrame(render);

                nowTime = (Date.now() - startTime) / 1000;

                // camera update
                camera.update();
                mat.lookAt(camera.cameraPosition, camera.centerPoint, camera.cameraUpDirection, vMatrix);
                mat.perspective(60, canvasWidth / canvasHeight, 0.1, camera.cameraDistance * 5.0, pMatrix);
                mat.multiply(pMatrix, vMatrix, vpMatrix);

                // program
                gl.useProgram(prg);

                // set vbo
                set_attribute(transformOutVBO, attLocation, attStride);
                gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, feedbackInVBO[0]);
                gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, feedbackInVBO[1]);
                gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 2, feedbackInVBO[2]);
                gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 3, feedbackInVBO[3]);

                // begin transform feedback
                gl.enable(gl.RASTERIZER_DISCARD);
                gl.beginTransformFeedback(gl.POINTS);

                // vertex transform
                gl.uniform1f(uniLocation[0], nowTime);
                gl.uniform2fv(uniLocation[1], mousePosition);
                gl.drawArrays(gl.POINTS, 0, imageWidth * imageHeight);

                // end transform feedback
                gl.disable(gl.RASTERIZER_DISCARD);
                gl.endTransformFeedback();
                gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
                gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, null);
                gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 2, null);
                gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 3, null);

                // clear
                gl.clearColor(0.0, 0.0, 0.0, 1.0);
                gl.clearDepth(1.0);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                gl.viewport(0, 0, canvasWidth, canvasHeight);

                // program
                gl.useProgram(fPrg);

                // set vbo
                set_attribute(feedbackInVBO, fAttLocation, fAttStride);

                // push and render
                gl.uniformMatrix4fv(fUniLocation[0], false, vpMatrix);
                gl.uniform1f(fUniLocation[1], nowTime);
                gl.drawArrays(gl.POINTS, 0, imageWidth * imageHeight);

                gl.flush();

                // animation loop
                if(run){req;}
            }
        }
    }, false);

    // utility functions ======================================================
    function create_shader(id){
        let shader;
        let scriptElement = document.getElementById(id);
        if(!scriptElement){return;}
        switch(scriptElement.type){
            case 'x-shader/x-vertex':
                shader = gl.createShader(gl.VERTEX_SHADER);
                break;
            case 'x-shader/x-fragment':
                shader = gl.createShader(gl.FRAGMENT_SHADER);
                break;
            default :
                return;
        }
        gl.shaderSource(shader, scriptElement.text);
        gl.compileShader(shader);
        if(gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
            return shader;
        }else{
            alert(gl.getShaderInfoLog(shader));
        }
    }

    function create_program(vs, fs){
        let program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        if(gl.getProgramParameter(program, gl.LINK_STATUS)){
            gl.useProgram(program);
            return program;
        }else{
            alert(gl.getProgramInfoLog(program));
        }
    }

    function create_program_tf_separate(vs, fs, varyings){
        let program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.transformFeedbackVaryings(program, varyings, gl.SEPARATE_ATTRIBS);
        gl.linkProgram(program);
        if(gl.getProgramParameter(program, gl.LINK_STATUS)){
            gl.useProgram(program);
            return program;
        }else{
            alert(gl.getProgramInfoLog(program));
        }
    }

    function create_vbo(data){
        let vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return vbo;
    }

    function create_vbo_feedback(data){
        let vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.DYNAMIC_COPY);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return vbo;
    }

    function set_attribute(vbo, attL, attS){
        for(let i in vbo){
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo[i]);
            gl.enableVertexAttribArray(attL[i]);
            gl.vertexAttribPointer(attL[i], attS[i], gl.FLOAT, false, 0, 0);
        }
    }

    function set_attribute_base(vbo){
        for(let i in vbo){
            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, i, vbo[i]);
        }
    }

    // interaction camera class ===============================================
    function InteractionCamera(defaultDistance){
        let distance = 10.0;
        if(defaultDistance && !isNaN(parseFloat(defaultDistance))){
            distance = defaultDistance;
        }
        this.cameraDistance     = distance;
        this.dCameraDistance    = this.cameraDistance;
        this.cameraPosition     = [0.0, 0.0, this.cameraDistance];
        this.centerPoint        = [0.0, 0.0, 0.0];
        this.cameraUpDirection  = [0.0, 1.0, 0.0];
        this.dCameraPosition    = [0.0, 0.0, this.cameraDistance];
        this.dCenterPoint       = [0.0, 0.0, 0.0];
        this.dCameraUpDirection = [0.0, 1.0, 0.0];
        this.cameraRotateX      = 0.0;
        this.cameraRotateY      = 0.0;
        this.cameraScale        = 0.0;
        this.clickStart         = false;
        this.prevPosition       = [0, 0];
        this.offsetPosition     = [0, 0];
        this.qtn = new qtnIV();
        this.qt  = this.qtn.identity(this.qtn.create());
        this.qtx = this.qtn.identity(this.qtn.create());
        this.qty = this.qtn.identity(this.qtn.create());

        this.mouseInteractionStart = function(eve){
            this.clickStart = true;
            this.prevPosition = [
                eve.pageX,
                eve.pageY
            ];
            eve.preventDefault();
        };
        this.mouseInteractionMove = function(eve){
            if(!this.clickStart){return;}
            let w = canvasWidth;
            let h = canvasHeight;
            let s = 1.0 / Math.min(w, h);
            this.offsetPosition = [
                eve.pageX - this.prevPosition[0],
                eve.pageY - this.prevPosition[1]
            ];
            this.prevPosition = [eve.pageX, eve.pageY];
            switch(eve.buttons){
                case 1:
                    this.cameraRotateX += this.offsetPosition[0] * s;
                    this.cameraRotateY += this.offsetPosition[1] * s;
                    this.cameraRotateX = this.cameraRotateX % 1.0;
                    this.cameraRotateY = Math.min(Math.max(this.cameraRotateY % 1.0, -0.25), 0.25);
                    break;
            }
        };
        this.mouseInteractionEnd = function(eve){
            this.clickStart = false;
        };
        this.wheelScroll = function(eve){
            let w = eve.wheelDelta;
            if(w > 0){
                this.cameraScale = 0.8;
            }else if(w < 0){
                this.cameraScale = -0.8;
            }
        };
        this.update = function(){
            let PI2 = Math.PI * 2.0;
            let v = [1.0, 0.0, 0.0];
            this.cameraScale *= 0.75;
            this.cameraDistance += this.cameraScale;
            this.cameraDistance = Math.min(Math.max(this.cameraDistance, this.dCameraDistance * 0.1), this.dCameraDistance * 2.0);
            this.dCameraPosition[2] = this.cameraDistance;
            this.qtn.identity(this.qt);
            this.qtn.identity(this.qtx);
            this.qtn.identity(this.qty);
            this.qtn.rotate(this.cameraRotateX * PI2, [0.0, 1.0, 0.0], this.qtx);
            this.qtn.toVecIII(v, this.qtx, v);
            this.qtn.rotate(this.cameraRotateY * PI2, v, this.qty);
            this.qtn.multiply(this.qtx, this.qty, this.qt);
            this.qtn.toVecIII(this.dCameraPosition, this.qt, this.cameraPosition);
            this.qtn.toVecIII(this.dCameraUpDirection, this.qt, this.cameraUpDirection);
        };
        this.mouseInteractionStart = this.mouseInteractionStart.bind(this);
        this.mouseInteractionMove = this.mouseInteractionMove.bind(this);
        this.mouseInteractionEnd = this.mouseInteractionEnd.bind(this);
        this.wheelScroll = this.wheelScroll.bind(this);
        this.update = this.update.bind(this);
    }
})();
