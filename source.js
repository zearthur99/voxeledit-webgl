var isTabActive = true;

var cursor = {
  position: {
    x: 0,
    y: 0,
    z: 0
  }
}

let data = [
  [
    [
      0,0,0
    ],
    [
      0,1,0
    ],
    [
      0,0,1
    ]
  ],
  [
    [
      0,0,0
    ],
    [
      0,1,0
    ],
    [
      0,0,0
    ]
  ],
  [
    [
      0,0,0
    ],
    [
      0,1,0
    ],
    [
      0,0,0
    ]
  ],
  [
    [
      0,1,0
    ],
    [
      1,0,1
    ],
    [
      0,1,0
    ]
  ],
  [
    [
      0,1,0
    ],
    [
      1,0,1
    ],
    [
      0,1,0
    ]
  ] ,
  [
    [
      0,0,0
    ],
    [
      0,1,0
    ],
    [
      0,0,0
    ]
  ]
];

document.getElementById("glcanvas").width = window.innerWidth;
document.getElementById("glcanvas").height = window.innerHeight;
main();

//
// Start here
//
function main() {
  const canvas = document.querySelector('#glcanvas');
  const gl = canvas.getContext('webgl');

  // If we don't have a GL context, give up now

  if (!gl) {
    alert('Unable to initialize WebGL. Your browser or machine may not support it.');
    return;
  }

  // Vertex shader program

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
      highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
      highp vec3 directionalLightColor = vec3(1, 1, 1);
      highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));
      highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);
      highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
      vLighting = ambientLight + (directionalLightColor * directional);
    }
  `;

  // Fragment shader program

  const fsSource = `
    varying highp vec2 vTextureCoord;
    varying highp vec3 vLighting;
    uniform sampler2D uSampler;
    void main(void) {
      highp vec4 texelColor = texture2D(uSampler, vTextureCoord);
      gl_FragColor = vec4(texelColor.rgb * vLighting, texelColor.a);
    }
  `;

  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // Collect all the info needed to use the shader program.
  // Look up which attributes our shader program is using
  // for aVertexPosition, aVertexNormal, aTextureCoord,
  // and look up uniform locations.
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

  // Here's where we call the routine that builds all the
  // objects we'll be drawing.

  const texture = loadTexture(gl, 'cubetexture.png');
  const texture2 = loadTexture(gl, 'Rectangle.png');

  var textureSet = [null, texture, texture2];

  var then = 0;

  // Draw the scene repeatedly
  function render(now) {

    now *= 0.001;  // convert to seconds
    const deltaTime = now - then;
    then = now;
    if (!document.hidden) {
      drawScene(gl, programInfo, textureSet, deltaTime);
    }
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

var mouseControl = {
  canvas: document.getElementById('glcanvas'),
  lastX: 0,
  lastY: 0,
  dragging: false,
  angle: {
    x: 0,
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
  // If we're within the rectangle, mouse is down within canvas.
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
    // The rotation speed factor
    // dx and dy here are how for in the x or y direction the mouse moved
    var factor = 100/mouseControl.canvas.height;
    var dx = factor * (x - mouseControl.lastX);
    var dy = factor * (y - mouseControl.lastY);

    // update the latest angle
    mouseControl.angle.x = mouseControl.angle.x + dy;
    mouseControl.angle.y = mouseControl.angle.y + dx;
    if (mouseControl.angle.x > 85) {
      mouseControl.angle.x = 85;
    } else if (mouseControl.angle.x < -85) {
      mouseControl.angle.x = -85;
    }
  }
  // update the last mouse position
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
    data[cursor.position.y/2][cursor.position.x/2][cursor.position.z/2] = 1
  }
  if (cursor.position.x < 0) {
    cursor.position.x = 0;
  }
  if (cursor.position.y < 0) {
    cursor.position.y = 0;
  }  if (cursor.position.z < 0) {
    cursor.position.z = 0;
  }
  console.log(cursor);
}

mouseControl.canvas.onmousedown = mousedown;
mouseControl.canvas.onmousemove = mousemove;
mouseControl.canvas.onmouseup = mouseup;
window.addEventListener('wheel', mousescroll);
window.addEventListener("keydown", keyPress);
//
// initBuffers
//
// Initialize the buffers we'll need. For this demo, we just
// have one object -- a simple three-dimensional cube.
//

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

function initBuffers(gl, x,y,z) {

  // Create a buffer for the cube's vertex positions.

  const positionBuffer = gl.createBuffer();

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Now create an array of positions for the cube.
  var positions = getCube(x,y,z);
  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  // Set up the normals for the vertices, so that we can compute lighting.

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

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals),
    gl.STATIC_DRAW);

  // Now set up the texture coordinates for the faces.

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

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
    gl.STATIC_DRAW);

  // Build the element array buffer; this specifies the indices
  // into the vertex arrays for each face's vertices.

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.

  const indices = [
    0,  1,  2,      0,  2,  3,    // front
    4,  5,  6,      4,  6,  7,    // back
    8,  9,  10,     8,  10, 11,   // top
    12, 13, 14,     12, 14, 15,   // bottom
    16, 17, 18,     16, 18, 19,   // right
    20, 21, 22,     20, 22, 23,   // left
  ];

  // Now send the element array to GL

  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices), gl.STATIC_DRAW);

  return {
    position: positionBuffer,
    normal: normalBuffer,
    textureCoord: textureCoordBuffer,
    indices: indexBuffer,
  };
}

//
// Initialize a texture and load an image.
// When the image finished loading copy it into the texture.
//
function loadTexture(gl, url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Because images have to be download over the internet
  // they might take a moment until they are ready.
  // Until then put a single pixel in the texture so we can
  // use it immediately. When the image has finished downloading
  // we'll update the texture with the contents of the image.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
    width, height, border, srcFormat, srcType,
    pixel);

  const image = new Image();
  image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
      srcFormat, srcType, image);

    // WebGL1 has different requirements for power of 2 images
    // vs non power of 2 images so check if the image is a
    // power of 2 in both dimensions.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
      // Yes, it's a power of 2. Generate mips.
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      // No, it's not a power of 2. Turn of mips and set
      // wrapping to clamp to edge
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

//
// Draw the scene.
//
function drawScene(gl, programInfo, textureSet, deltaTime) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  gl.enable ( gl.BLEND ) ;

  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Create a perspective matrix, a special matrix that is
  // used to simulate the distortion of perspective in a camera.
  // Our field of view is 45 degrees, with a width/height
  // ratio that matches the display size of the canvas
  // and we only want to see objects between 0.1 units
  // and 100 units away from the camera.

  const fieldOfView = 45 * Math.PI / 180;   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = glMatrix.mat4.create();

  // note: glmatrix.js always has the first argument
  // as the destination to receive the result.
  glMatrix.mat4.perspective(projectionMatrix,
    fieldOfView,
    aspect,
    zNear,
    zFar);

  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  const modelViewMatrix = glMatrix.mat4.create();

  // Now move the drawing position a bit to where we want to
  // start drawing the square.

  glMatrix.mat4.translate(modelViewMatrix,     // destination matrix
    modelViewMatrix,     // matrix to translate
    [-0.0, 0.0, -6.0]);  // amount to translate
  glMatrix.mat4.rotate(modelViewMatrix,  // destination matrix
    modelViewMatrix,  // matrix to rotate
    mouseControl.angle.y * Math.PI / 180,     // amount to rotate in radians
    [0, 1, 0]);       // axis to rotate around (Z)
  glMatrix.mat4.rotate(modelViewMatrix,  // destination matrix
    modelViewMatrix,  // matrix to rotate
    mouseControl.angle.x * Math.PI / 180,// amount to rotate in radians
    [1, 0, 0]);       // axis to rotate around (X)
  glMatrix.mat4.scale(modelViewMatrix, modelViewMatrix, [mouseControl.scale,mouseControl.scale,mouseControl.scale]);
  glMatrix.mat4.translate(modelViewMatrix, modelViewMatrix, [mouseControl.xTranslate,mouseControl.yTranslate,0]);

  const normalMatrix = glMatrix.mat4.create();
  glMatrix.mat4.invert(normalMatrix, modelViewMatrix);
  glMatrix.mat4.transpose(normalMatrix, normalMatrix);

  let currentXPos = 0;
  let currentYPos = 0;
  let currentZPos = 0;
  let increment = 2;

  data.forEach((eachLayer) => {
    currentXPos = 0;
    eachLayer.forEach((eachRow) => {
      currentZPos = 0;
      eachRow.forEach((eachCube) => {
        if (eachCube === 1) {
          drawCube(gl, programInfo, textureSet[eachCube], projectionMatrix, modelViewMatrix, normalMatrix, currentXPos,currentYPos,currentZPos);
        }
        currentZPos += increment;
      })
      currentXPos += increment;
    })
    currentYPos += increment;
  });
  drawCube(gl, programInfo, textureSet[2], projectionMatrix, modelViewMatrix, normalMatrix, cursor.position.x,cursor.position.y,cursor.position.z);

}

function drawCube(gl, programInfo, texture, projectionMatrix, modelViewMatrix, normalMatrix, x,y,z) {
  // Tell WebGL how to pull out the normals from
  // the normal buffer into the vertexNormal attribute.

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

  // Tell WebGL how to pull out the texture coordinates from
  // the texture coordinate buffer into the textureCoord attribute.
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

  // Tell WebGL how to pull out the normals from
  // the normal buffer into the vertexNormal attribute.
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

  // Tell WebGL which indices to use to index the vertices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

  // Tell WebGL to use our program when drawing

  gl.useProgram(programInfo.program);

  // Set the shader uniforms

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

  // Specify the texture to map onto the faces.

  // Tell WebGL we want to affect texture unit 0
  gl.activeTexture(gl.TEXTURE0);

  // Bind the texture to texture unit 0
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Tell the shader we bound the texture to texture unit 0
  gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

  {
    const vertexCount = 36;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }
}

//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object

  gl.shaderSource(shader, source);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}
