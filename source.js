var isTabActive = true;

var cursor = {
  position: {
    x: 0,
    y: 0,
    z: 0
  }
}

var buffers = {
  normalBuffer: null,
  indexBuffer: null,
  textureCoordBuffer: null,
  positionBuffer: null
}

function generateMatrix( rows, cols, depth, defaultValue){
  return Array.from(Array(rows),
    () => Array.from(Array(cols),
      () => Array.from(Array(depth),() => defaultValue)
  ));
}

var matrixSize = 10;

let data = generateMatrix(matrixSize,matrixSize,matrixSize, 0);
let dataJson = undefined;
updateDataJson();

var selectedTexture = 3;

document.getElementById("glcanvas").width = window.innerWidth;
document.getElementById("glcanvas").height = window.innerHeight;
main();

function main() {
  const canvas = document.querySelector('#glcanvas');
  const gl = canvas.getContext('webgl');

  if (!gl) {
    alert('Falha ao inicializar o WebGL.');
    return;
  }

  const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec3 aVertexNormal;
    attribute vec2 aTextureCoord;
    uniform mat4 uNormalMatrix;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    varying highp vec2 vTextureCoord;
    varying highp vec3 vLighting;
    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vTextureCoord = aTextureCoord;
      // Apply lighting effect
      highp vec3 ambientLight = vec3(0.6, 0.6, 0.6);
      highp vec3 directionalLightColor = vec3(0.06, 0.06, 0.06);
      highp vec3 directionalVector = normalize(vec3(-1, 1, 1));
      highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);
      highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
      vLighting = ambientLight + (directionalLightColor * directional);
    }
  `;

  const fsSource = `
    varying highp vec2 vTextureCoord;
    varying highp vec3 vLighting;
    uniform sampler2D uSampler;
    void main(void) {
      highp vec4 texelColor = texture2D(uSampler, vTextureCoord);
      gl_FragColor = vec4(texelColor.rgb * vLighting, texelColor.a);
    }
  `;

  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
      textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
      normalMatrix: gl.getUniformLocation(shaderProgram, 'uNormalMatrix'),
      uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
    },
  };

  var textureSet = [
    null,
    loadTexture(gl, 'cubetexture.png'),
    loadTexture(gl, 'Rectangle.png'),
    loadTexture(gl, undefined, 48,24,0),
    loadTexture(gl, undefined, 0,255,53),
    loadTexture(gl, undefined, 0,246,255),
    loadTexture(gl, undefined, 255,161,0),
    loadTexture(gl, undefined, 0,26,255),
    loadTexture(gl, undefined, 255,0,13),
    loadTexture(gl, undefined, 255,255,0),
    loadTexture(gl, undefined, 0,154,1),
    loadTexture(gl, undefined, 255,0,253),
    loadTexture(gl, undefined, 255,0,120),
    loadTexture(gl, undefined, 221,161,255),
    loadTexture(gl, 'shell.png', 200,200,200),
  ];

  var then = 0;

  function render(now) {
    now *= 0.001;
    then = now;
    if (!document.hidden) {
      drawScene(gl, programInfo, textureSet);
    }
    if (document.getElementById('rotation').checked) {
      this.mouseControl.angle.y+= 0.5;
    }
    requestAnimationFrame(render);
  }

  preloadBuffers(gl);

  requestAnimationFrame(render);
}

var mouseControl = {
  canvas: document.getElementById('glcanvas'),
  lastX: 0,
  lastY: 0,
  dragging: false,
  angle: {
    x: 45,
    y: -135,
  },
  scale: 0.2,
  yTranslate: -data.length,
  xTranslate: data[0][0].length
}

function mousedown(event) {
  var x = event.clientX;
  var y = event.clientY;
  var rect = event.target.getBoundingClientRect();
  if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
    mouseControl.lastX = x;
    mouseControl.lastY = y;
    mouseControl.dragging = true;
  }
}

function mouseup(event) {
  mouseControl.dragging = false;
}

function mousemove(event) {
  var x = event.clientX;
  var y = event.clientY;
  if (mouseControl.dragging) {

    var factor = 100/mouseControl.canvas.height;
    var dx = factor * (x - mouseControl.lastX);
    var dy = factor * (y - mouseControl.lastY);

    mouseControl.angle.x = mouseControl.angle.x + dy;
    mouseControl.angle.y = mouseControl.angle.y + dx;
    if (mouseControl.angle.x > 85) {
      mouseControl.angle.x = 85;
    } else if (mouseControl.angle.x < -85) {
      mouseControl.angle.x = -85;
    }
  }

  mouseControl.lastX = x;
  mouseControl.lastY = y;
}

function mousescroll(e) {
    wDelta = e.deltaY < 0 ? 'up' : 'down';
    if (wDelta === 'up') {
      mouseControl.scale -= 0.2;
    } else {
      mouseControl.scale += 0.2;
    }
    if (mouseControl.scale < 0.2) {
      mouseControl.scale = 0.2;
    }
  if (mouseControl.scale > 2) {
    mouseControl.scale = 2;
  }
}

function updateDataJson() {
  dataJson = JSON.stringify(data);
  document.getElementById("dataJson").innerText = dataJson;
}

function keyPress(e) {
  if (e.key === 'a') {
    mouseControl.xTranslate += 1;
  }
  if (e.key === 'd') {
    mouseControl.xTranslate -= 1;
  }
  if (e.key === 's') {
    mouseControl.yTranslate += 1;
  }
  if (e.key === 'w') {
    mouseControl.yTranslate -= 1;
  }
  if (e.key === 'ArrowLeft') {
    cursor.position.x+=2;
  }
  if (e.key === 'ArrowRight') {
    cursor.position.x-=2;
  }
  if (e.key === 'ArrowUp') {
    cursor.position.z+=2;
  }
  if (e.key === 'ArrowDown') {
    cursor.position.z-=2;
  }
  if (e.key === 'Shift') {
    cursor.position.y+=2;
  }
  if (e.key === 'Control') {
    cursor.position.y-=2;
  }
  if (e.key === ' ') {
    data[cursor.position.y/2][cursor.position.x/2][cursor.position.z/2] = selectedTexture;
    updateDataJson();
  }
  if (cursor.position.x < 0) {
    cursor.position.x = 0;
  }
  if (cursor.position.x/2 >= matrixSize) {
    cursor.position.x = 0;
  }
  if (cursor.position.y < 0) {
    cursor.position.y = 0;
  }
  if (cursor.position.y/2 >= matrixSize) {
    cursor.position.y = 0;
  }
  if (cursor.position.z < 0) {
    cursor.position.z = 0;
  }
  if (cursor.position.z/2 >= matrixSize) {
    cursor.position.z = 0;
  }
}

mouseControl.canvas.onmousedown = mousedown;
mouseControl.canvas.onmousemove = mousemove;
mouseControl.canvas.onmouseup = mouseup;
//window.addEventListener('wheel', mousescroll);
window.addEventListener("keydown", keyPress);

function getCube(x,y,z) {
  return [
    // Front face
    -1.0+x, -1.0+y,  1.0+z,
    1.0+x, -1.0+y,  1.0+z,
    1.0+x,  1.0+y,  1.0+z,
    -1.0+x,  1.0+y,  1.0+z,

    // Back face
    -1.0+x, -1.0+y, -1.0+z,
    -1.0+x,  1.0+y, -1.0+z,
    1.0+x,  1.0+y, -1.0+z,
    1.0+x, -1.0+y, -1.0+z,

    // Top face
    -1.0+x,  1.0+y, -1.0+z,
    -1.0+x,  1.0+y,  1.0+z,
    1.0+x,  1.0+y,  1.0+z,
    1.0+x,  1.0+y, -1.0+z,

    // Bottom face
    -1.0+x, -1.0+y, -1.0+z,
    1.0+x, -1.0+y, -1.0+z,
    1.0+x, -1.0+y,  1.0+z,
    -1.0+x, -1.0+y,  1.0+z,

    // Right face
    1.0+x, -1.0+y, -1.0+z,
    1.0+x,  1.0+y, -1.0+z,
    1.0+x,  1.0+y,  1.0+z,
    1.0+x, -1.0+y,  1.0+z,

    // Left face
    -1.0+x, -1.0+y, -1.0+z,
    -1.0+x, -1.0+y,  1.0+z,
    -1.0+x,  1.0+y,  1.0+z,
    -1.0+x,  1.0+y, -1.0+z,
  ];

}

function preloadBuffers(gl) {
  const normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

  const vertexNormals = [
    // Front
    0.0,  0.0,  1.0,
    0.0,  0.0,  1.0,
    0.0,  0.0,  1.0,
    0.0,  0.0,  1.0,

    // Back
    0.0,  0.0, -1.0,
    0.0,  0.0, -1.0,
    0.0,  0.0, -1.0,
    0.0,  0.0, -1.0,

    // Top
    0.0,  1.0,  0.0,
    0.0,  1.0,  0.0,
    0.0,  1.0,  0.0,
    0.0,  1.0,  0.0,

    // Bottom
    0.0, -1.0,  0.0,
    0.0, -1.0,  0.0,
    0.0, -1.0,  0.0,
    0.0, -1.0,  0.0,

    // Right
    1.0,  0.0,  0.0,
    1.0,  0.0,  0.0,
    1.0,  0.0,  0.0,
    1.0,  0.0,  0.0,

    // Left
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);

  const textureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);

  const textureCoordinates = [
    // Front
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Back
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Top
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Bottom
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Right
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Left
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  const indices = [
    0,  1,  2,      0,  2,  3,
    4,  5,  6,      4,  6,  7,
    8,  9,  10,     8,  10, 11,
    12, 13, 14,     12, 14, 15,
    16, 17, 18,     16, 18, 19,
    20, 21, 22,     20, 22, 23,
  ];

  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices), gl.STATIC_DRAW);

  buffers.textureCoordBuffer = textureCoordBuffer;
  buffers.normalBuffer = normalBuffer;
  buffers.indexBuffer = indexBuffer;
  buffers.positionBuffer = gl.createBuffer();

}

var isFirst = true;

function initBuffers(gl, x,y,z) {

  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.positionBuffer);

  var positions = getCube(x,y,z);
  if (isFirst) {
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);
  } else {
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(positions));
  }

  isFirst = false;

  return {
    position: buffers.positionBuffer,
    normal: buffers.normalBuffer,
    textureCoord: buffers.textureCoordBuffer,
    indices: buffers.indexBuffer,
  };
}

function loadTexture(gl, url = undefined, r = 0,g = 255,b = 255, a = 255) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([r, g, b, a]);
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
    width, height, border, srcFormat, srcType,
    pixel);

    const image = new Image();
    image.onload = function() {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
        srcFormat, srcType, image);
      if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
        gl.generateMipmap(gl.TEXTURE_2D);
      } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      }
    };
    image.src = url;

  return texture;
}

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}

function drawScene(gl, programInfo, textureSet) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  gl.enable ( gl.BLEND ) ;

  gl.depthFunc(gl.LEQUAL);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const fieldOfView = 45 * Math.PI / 180;
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = glMatrix.mat4.create();

  glMatrix.mat4.perspective(projectionMatrix,
    fieldOfView,
    aspect,
    zNear,
    zFar);

  const modelViewMatrix = glMatrix.mat4.create();

  glMatrix.mat4.translate(modelViewMatrix,
    modelViewMatrix,
    [-1.4, 0.0, -10.0]);
  glMatrix.mat4.rotate(modelViewMatrix,
    modelViewMatrix,
    mouseControl.angle.x * Math.PI / 180,
    [1, 0, 0]);
  glMatrix.mat4.rotate(modelViewMatrix,
    modelViewMatrix,
    mouseControl.angle.y * Math.PI / 180,
    [0, 1, 0]);
  glMatrix.mat4.translate(modelViewMatrix,
    modelViewMatrix,
    [-4, +1.4, -3.5]);

  glMatrix.mat4.scale(modelViewMatrix, modelViewMatrix, [mouseControl.scale,mouseControl.scale,mouseControl.scale]);
  glMatrix.mat4.translate(modelViewMatrix, modelViewMatrix, [mouseControl.xTranslate,mouseControl.yTranslate,0]);

  const normalMatrix = glMatrix.mat4.create();
  glMatrix.mat4.invert(normalMatrix, modelViewMatrix);
  glMatrix.mat4.transpose(normalMatrix, normalMatrix);

  let currentXPos = 0;
  let currentYPos = 0;
  let currentZPos = 0;
  let increment = 2;

  for (let i = -1; i < data.length; i++) {
    currentXPos = 0;
    for (let j = -1; j < data[0].length; j++) {
      currentZPos = 0;
      for (let k = 0; k < data[0][0].length + 1; k++) {
        if (i === -1) {
          if (k < data[0][0].length && document.getElementById('drawFloor').checked) {
            drawCube(gl, programInfo, textureSet[14], projectionMatrix, modelViewMatrix, normalMatrix, currentXPos,-2,currentZPos);
          }
        } else {
          if (j===-1){
            if (document.getElementById('drawWalls').checked) {
              drawCube(gl, programInfo, textureSet[14], projectionMatrix, modelViewMatrix, normalMatrix,-2,currentYPos,currentZPos);
            }
          } else {
            if (k === data[i][j].length) {
              if (document.getElementById('drawWalls').checked) {
                drawCube(gl, programInfo, textureSet[14], projectionMatrix, modelViewMatrix, normalMatrix, currentXPos, currentYPos, currentZPos);
              }
            } else {
              if (data[i][j][k]) {
                drawCube(gl, programInfo, textureSet[data[i][j][k]], projectionMatrix, modelViewMatrix, normalMatrix, currentXPos,currentYPos,currentZPos);
              }
            }
          }
        }
        currentZPos += increment;
      }
      if (j > -1) {
        currentXPos += increment;
      }
    }
    if (i > -1) {
      currentYPos += increment;
    }
  }

  if (document.getElementById('disableDepthTestCursor').checked) {
    gl.disable(gl.DEPTH_TEST);
  }

  drawCube(gl, programInfo, textureSet[2], projectionMatrix, modelViewMatrix, normalMatrix, cursor.position.x,cursor.position.y,cursor.position.z);

}

function drawCube(gl, programInfo, texture, projectionMatrix, modelViewMatrix, normalMatrix, x,y,z) {
  const numComponents = 3;
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0;
  const offset = 0;

  var buffers = initBuffers(gl,x,y,z);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  gl.vertexAttribPointer(
    programInfo.attribLocations.vertexPosition,
    numComponents,
    type,
    normalize,
    stride,
    offset);
  gl.enableVertexAttribArray(
    programInfo.attribLocations.vertexPosition);
  {
    const numComponents = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
    gl.vertexAttribPointer(
      programInfo.attribLocations.textureCoord,
      numComponents,
      type,
      normalize,
      stride,
      offset);
    gl.enableVertexAttribArray(
      programInfo.attribLocations.textureCoord);
  }

  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexNormal,
      numComponents,
      type,
      normalize,
      stride,
      offset);
    gl.enableVertexAttribArray(
      programInfo.attribLocations.vertexNormal);
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
  gl.useProgram(programInfo.program);

  gl.uniformMatrix4fv(
    programInfo.uniformLocations.projectionMatrix,
    false,
    projectionMatrix);
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.modelViewMatrix,
    false,
    modelViewMatrix);
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.normalMatrix,
    false,
    normalMatrix);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

  {
    const vertexCount = 36;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }
}

function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Não foi possível inicializar o shader: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

function loadShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}
