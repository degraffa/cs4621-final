var gl_matrix_1 = require('gl-matrix');

// Initializes webgl object. Handles errors related to this.
// @param {html canvas element} canvas - The canvas of the webpage.
// @return {gl} the WebGl data structure which will contain webgl functionality
function initializeWebGL(canvas) {
    var gl = null;
    try {
        gl = canvas[0].getContext("experimental-webgl");
        if (!gl) {
            gl = canvas[0].getContext("webgl");
        }
    }
    catch (error) {
    }
    if (!gl) {
        alert("Could not get WebGL context!");
        throw new Error("Could not get WebGL context!");
    }
    return gl;
}
// Creates webgl shader from given script id.
// @param gl - The webgl object.
// @param shaderScriptId - The id of the shader script in the html page.
function createShader(gl, shaderScriptId) {
    var shaderScript = $("#" + shaderScriptId);
    var shaderSource = shaderScript[0].text;
    var shaderType = null;
    if (shaderScript[0].type == "x-shader/x-vertex") {
        shaderType = gl.VERTEX_SHADER;
    }
    else if (shaderScript[0].type == "x-shader/x-fragment") {
        shaderType = gl.FRAGMENT_SHADER;
    }
    else {
        throw new Error("Invalid shader type: " + shaderScript[0].type);
    }
    var shader = gl.createShader(shaderType);
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        var infoLog = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error("An error occurred compiling the shader: " + infoLog);
    }
    else {
        return shader;
    }
}
// Attaches given shaders to the webgl object, then creates and validates the
// program.
// @param gl - webgl object.
// @param vertexShaderId - The id of the vertex shader in the html page.
// @param fragmentShaderId - The id of the fragment shader in the html page.
function createGlslProgram(gl, vertexShaderId, fragmentShaderId) {
    var program = gl.createProgram();
    gl.attachShader(program, createShader(gl, vertexShaderId));
    gl.attachShader(program, createShader(gl, fragmentShaderId));
    gl.linkProgram(program);
    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        var infoLog = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw new Error("An error occurred linking the program: " + infoLog);
    }
    else {
        return program;
    }
}
function getViewMat(camPos, camDir, camUp) {
    var lookPoint = gl_matrix_1.vec3.create();
    gl_matrix_1.vec3.add(lookPoint, camPos, camDir);
    var viewMat = gl_matrix_1.mat4.create();
    gl_matrix_1.mat4.lookAt(viewMat, camPos, lookPoint, camUp);
    return viewMat;
}
function getProjectionMat(fieldOfView, aspectRatio, near, far) {
    var projectionMat = gl_matrix_1.mat4.create();
    gl_matrix_1.mat4.perspective(projectionMat, fieldOfView, aspectRatio, near, far);
    return projectionMat;
}
function getMVP(viewMatrix, projectionMatrix) {
    var mvpMatrix = gl_matrix_1.mat4.create();
    gl_matrix_1.mat4.multiply(mvpMatrix, mvpMatrix, projectionMatrix);
    gl_matrix_1.mat4.multiply(mvpMatrix, mvpMatrix, viewMatrix);
    return mvpMatrix;
}
function updateMVP(gl, program, projInfo, viewInfo) {
    var viewMat = getViewMat(viewInfo.camPos, viewInfo.camDir, viewInfo.camUp);
    var projectionMat = getProjectionMat(projInfo.fieldOfView, projInfo.aspectRatio, projInfo.near, projInfo.far);
    var mvp = getMVP(viewMat, projectionMat);
    // TODO: Don't just hardcode this lmao
    var mvpLocation = gl.getUniformLocation(program, "modelViewProjection");
    gl.uniformMatrix4fv(mvpLocation, false, mvp);
}
// Begins process of loading an image 
// @param {string} - imageSrc - the file path to the image to be loaded
// @return {Image} returns image data structure, may not be loaded fully
function loadImage(imageSrc) {
    var image = new Image();
    image.crossOrigin = "anonymous";
    image.src = imageSrc;
    return image;
}
// Handles main rendering animation loop. Calls itself every frame.
function runWebGl(scene) {
    var gl = initializeWebGL($("#webGlCanvas"));
    // Tell WebGL to test the depth when drawing
    gl.enable(gl.DEPTH_TEST);
    // cull back-facing triangles
    gl.enable(gl.CULL_FACE);
    var camera = scene.getCamera();
    function updateWebGl() {
        // Get list of all renderable objects from the scene.
        var meshObjects = scene.getMeshObjects();
        // Get info to update view & projection matrices based on camera.
        var projInfo = {
            fieldOfView: camera.fieldOfView,
            aspectRatio: camera.aspectRatio,
            near: camera.near,
            far: camera.far
        };
        var viewInfo = {
            camPos: camera.transform.position,
            camDir: camera.getCamDir(),
            camUp: camera.getCamUp()
        };
        // TODO: For each renderable object...
        for (var i = 0; i < meshObjects.length; i++) {
            // TODO: Create a program for it's material 
            // (load its shaders, set its attributes/uniforms from given data)
            // For now, just hardcode in the default shader
            var program = createGlslProgram(gl, "vertexShader", "fragmentShader");
            // TODO: Get shape data
            // Update model matrix based on transform
            updateMVP(gl, program, projInfo, viewInfo);
        }
        // TODO: Have some way of handling which textures are assigned to which WebGL texture int thing
        requestAnimationFrame(updateWebGl);
    }
    requestAnimationFrame(updateWebGl);
}