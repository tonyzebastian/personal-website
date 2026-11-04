"use client";

import { useEffect, useRef } from "react";
import styles from "./EveningWindow.module.css";
import { releaseContext } from "@/lib/webgl";

const vertexShader = `
  attribute vec2 a_position;
  varying vec2 v_uv;

  void main() {
    v_uv = a_position * .5 + .5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;

  uniform vec2 u_resolution;
  uniform vec2 u_css_resolution;
  uniform float u_time;
  uniform sampler2D u_wall_texture;
  uniform float u_exposure;
  uniform float u_texture_amount;
  uniform float u_pores_amount;
  uniform float u_room_variation;
  uniform float u_corner_shadow;
  uniform float u_wall_warmth;
  uniform float u_canopy_enabled;
  uniform float u_canopy_intensity;
  uniform float u_canopy_movement;
  uniform float u_canopy_scale;
  uniform float u_canopy_horizontal_spread;
  uniform float u_canopy_vertical_reach;
  uniform float u_canopy_softness;
  uniform float u_reflected_flecks_enabled;
  uniform float u_reflected_flecks_intensity;
  uniform float u_reflected_flecks_movement;
  uniform float u_reflected_flecks_size;
  uniform float u_reflected_flecks_spread;
  varying vec2 v_uv;

  float hash(vec2 point) {
    return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 point) {
    vec2 cell = floor(point);
    vec2 local = fract(point);
    local = local * local * (3.0 - 2.0 * local);

    return mix(
      mix(hash(cell), hash(cell + vec2(1.0, 0.0)), local.x),
      mix(hash(cell + vec2(0.0, 1.0)), hash(cell + vec2(1.0, 1.0)), local.x),
      local.y
    );
  }

  float fbm(vec2 point) {
    float value = 0.0;
    float strength = .55;

    for (int i = 0; i < 4; i++) {
      value += noise(point) * strength;
      point = point * 2.03 + 4.7;
      strength *= .5;
    }

    return value;
  }

  // Mirrored tiling makes the left/right and top/bottom edge pixels meet their
  // own reflection, preventing a visible tile seam in a non-seamless photo.
  float mirroredRepeat(float coordinate) {
    float tile = floor(coordinate);
    float local = fract(coordinate);
    return mix(local, 1.0 - local, mod(tile, 2.0));
  }

  // Small, broken pools of bounced daylight. They are intentionally sparse:
  // a reflection should feel like a secondary path of light, never a second
  // window projected over the whole wall.
  float reflectedFleck(vec2 point, vec2 centre, vec2 radius, float phase, float time) {
    vec2 local = (point - centre) / radius;
    vec2 warp = vec2(
      fbm(point * 4.2 + vec2(phase, time)) - .5,
      fbm(point * 5.1 + vec2(time * .72, phase + 3.0)) - .5
    );
    local += warp * .34;
    float pool = exp(-dot(local, local) * 3.1);
    float breakup = smoothstep(.42, .69, fbm(point * 10.0 + vec2(phase, time * .55)));
    return pool * mix(.46, 1.0, breakup);
  }

  void main() {
    vec2 aspectUv = v_uv;
    aspectUv.x *= u_resolution.x / u_resolution.y;
    float slowTime = u_time * .012;

    // A painted wall has several *different scales* of irregularity. The
    // broad layer is the uneven coat of paint; the warped mid layer suggests
    // plaster beneath it; only then do the tiny pores make it feel tactile.
    // Keeping their contrast low avoids the familiar "digital noise" look.
    float cloud = fbm(aspectUv * .82 + vec2(4.0, slowTime * .35)) - .5;
    vec2 plasterWarp = vec2(
      fbm(aspectUv * 1.45 + vec2(8.0, 1.0)),
      fbm(aspectUv * 1.45 + vec2(2.0, 9.0))
    ) - .5;
    float plaster = fbm(aspectUv * 3.15 + plasterWarp * .52 + vec2(slowTime, 2.0)) - .5;
    float mottling = fbm(aspectUv * 7.4 + plasterWarp * .25 + 6.0) - .5;
    // Palette sampled directly from the supplied Figma blocks. The reference
    // is restrained: off-white, a single blue-grey, and mineral shadows—not
    // saturated blue/yellow or a made-up "mood" palette.
    vec3 deepShadow = vec3(.318, .322, .298);  // #51524C
    vec3 offWhite = vec3(.898, .898, .898);    // #E5E5E5
    vec3 blueGrey = vec3(.412, .447, .475);    // #697279
    vec3 midTone = vec3(.427, .427, .427);     // #6D6D6D
    vec3 mineralLight = vec3(.482, .490, .447); // #7B7D72
    vec3 mineralShade = vec3(.471, .482, .455); // #787B74

    // The upper-left is chalky off-white with changes in brightness only.
    // In the lower wall, the blue-grey and off-white reveal one another in
    // broad, irregular patches rather than forming a clean vertical gradient.
    float topLight = smoothstep(.20, 1.02, v_uv.y);
    float lowerOffWhite = clamp(.40 + cloud * .42 + plaster * .20, .10, .82);
    vec3 lowerWall = mix(blueGrey, offWhite, lowerOffWhite);
    vec3 upperWall = offWhite * (1.0 + cloud * .085 + plaster * .032);
    vec3 wall = mix(lowerWall, upperWall, topLight);
    float mineralMottle = smoothstep(.57, .82, mottling + .5);
    wall = mix(wall, midTone, mineralMottle * (1.0 - topLight) * .055);

    // The room is never lit by one perfectly even source. These broad,
    // low-contrast pools are ambient bounce from different directions: a
    // warmer reflection from the right, a quieter cool-grey lift to the left,
    // and a very soft low reflection. They have no visible boundary.
    vec2 lightUv = vec2(v_uv.x * u_resolution.x / u_resolution.y, v_uv.y);
    float rightBounce = exp(-dot(lightUv - vec2(1.03, .30), lightUv - vec2(1.03, .30)) * 1.85);
    float leftBounce = exp(-dot(lightUv - vec2(.14, .57), lightUv - vec2(.14, .57)) * 2.7);
    float lowBounce = exp(-dot(lightUv - vec2(.76, 1.08), lightUv - vec2(.76, 1.08)) * 2.25);
    float topLeftLift = exp(-dot(lightUv - vec2(.19, .91), lightUv - vec2(.19, .91)) * 3.4);
    wall = mix(wall, offWhite, rightBounce * .075 * u_room_variation);
    wall = mix(wall, mineralLight, leftBounce * .055 * u_room_variation);
    wall = mix(wall, offWhite, lowBounce * .045 * u_room_variation);
    wall = mix(wall, offWhite, topLeftLift * .19 * u_room_variation);

    // The lower-right corner falls away from the room's bounced daylight. It
    // remains broad enough to read as spatial depth, not a vignette.
    float lowerRightOcclusion = exp(-dot(lightUv - vec2(1.58, .08), lightUv - vec2(1.58, .08)) * 4.4);
    wall = mix(wall, deepShadow, lowerRightOcclusion * .25 * u_corner_shadow);

    // Fine pores plus a very soft vertical application grain. These are
    // anchored to the wall, never animated as screen grain.
    float pores = fbm(v_uv * vec2(470.0, 620.0) + 2.0) - .5;
    float fibres = fbm(v_uv * vec2(105.0, 720.0) + vec2(2.0, 5.0)) - .5;
    float speckle = hash(floor(v_uv * u_resolution * 1.15)) - .5;
    float poreDots = smoothstep(.84, .985, hash(floor(v_uv * u_resolution * .58) + 17.0));
    wall += (pores * .022 + fibres * .012 + speckle * .010) * u_pores_amount;
    wall -= poreDots * .022 * u_pores_amount;

    // Repeat the photograph at its native 640px scale. It is mirrored at
    // each join so its non-seamless edges cannot form a grid on the wall.
    vec2 textureUv = vec2(
      mirroredRepeat(v_uv.x * u_css_resolution.x / 640.0),
      mirroredRepeat(v_uv.y * u_css_resolution.y / 640.0)
    );
    vec3 photographedPlaster = texture2D(u_wall_texture, textureUv).rgb;
    float plasterValue = dot(photographedPlaster, vec3(.2126, .7152, .0722));
    float plasterTone = plasterValue - .58;
    vec2 texturePixel = vec2(.0022, .0022);
    float surroundingPlaster = (
      dot(texture2D(u_wall_texture, textureUv + vec2(texturePixel.x, 0.0)).rgb, vec3(.2126, .7152, .0722)) +
      dot(texture2D(u_wall_texture, textureUv - vec2(texturePixel.x, 0.0)).rgb, vec3(.2126, .7152, .0722)) +
      dot(texture2D(u_wall_texture, textureUv + vec2(0.0, texturePixel.y)).rgb, vec3(.2126, .7152, .0722)) +
      dot(texture2D(u_wall_texture, textureUv - vec2(0.0, texturePixel.y)).rgb, vec3(.2126, .7152, .0722))
    ) * .25;
    float plasterRelief = plasterValue - surroundingPlaster;
    wall *= 1.0 + (plasterTone * .23 + plasterRelief * .56) * u_texture_amount;

    // Final exposure pass: it changes only brightness, never the palette.
    // The lower part of the room falls away from the light, while the bright
    // upper wall is gently held back so it does not become a white screen.
    float bottomDarkening = 1.0 - smoothstep(.02, .58, v_uv.y);
    float topToning = smoothstep(.28, .92, v_uv.y);
    wall *= 1.0 - bottomDarkening * .17 - topToning * .26;

    // Final neutral exposure filter, applied after every other wall treatment.
    wall *= u_exposure;
    // Wall warmth is deliberately separate from exposure. A small chromatic
    // bias rather than a brightness lift makes its response visible even in
    // the pale plaster, while the wall texture and tonal structure remain.
    float wallWarmth = clamp(u_wall_warmth, 0.0, 1.5);
    vec3 warmWallTint = vec3(1.055, .972, .79);
    wall *= mix(vec3(1.0), warmWallTint, wallWarmth);

    // A second, broad daylight source lives across the wall rather than in
    // the window projection. It is deliberately abstract: overlapping noise
    // thresholds imply a moving canopy without becoming a second illustrated
    // tree. The field begins at the upper-right and dissolves before it can
    // read as a flat screen overlay.
    // Move the field on a looping, multi-axis sway. A linear offset was too
    // easy to read as a static texture at the low default speed; this gives
    // the canopy a clearly perceptible but still unhurried breeze motion.
    float canopyTime = u_time * (.75 + u_canopy_movement * 1.25) * u_canopy_movement;
    vec2 canopyUv = vec2(
      v_uv.x * u_resolution.x / u_resolution.y,
      v_uv.y
    );
    vec2 canopyDrift = vec2(
      sin(canopyTime) * .13 + sin(canopyTime * .43 + .7) * .045,
      cos(canopyTime * 1.17 + .4) * .075
    ) * u_canopy_movement;
    vec2 canopyWarp = vec2(
      fbm(canopyUv * .88 + canopyDrift + vec2(7.1, 2.4)),
      fbm(canopyUv * .88 - canopyDrift * .72 + vec2(1.8, 8.7))
    ) - .5;
    vec2 canopyPattern = (canopyUv + canopyWarp * .22) / u_canopy_scale;
    float canopyClusters = fbm(canopyPattern * 2.05 + canopyDrift * .65);
    float canopyDetail = fbm(canopyPattern * 5.7 - canopyDrift * 1.2 + 13.0);
    float canopyShape = canopyClusters * .72 + canopyDetail * .28;
    float canopyThreshold = mix(.64, .51, u_canopy_softness);
    float canopyLeaves = smoothstep(
      canopyThreshold - u_canopy_softness * .13,
      canopyThreshold + .12,
      canopyShape
    );
    float fromRight = 1.0 - smoothstep(
      .03,
      u_canopy_horizontal_spread,
      1.0 - v_uv.x
    );
    float fromTop = 1.0 - smoothstep(
      .02,
      u_canopy_vertical_reach,
      1.0 - v_uv.y
    );
    // Keep the field decisively rooted at the upper-right. Raising the
    // combined falloff prevents the leaf breakup from spreading evenly across
    // the wall when either coverage dial is opened up.
    float canopyFalloff = pow(max(0.0, fromRight * fromTop), .72);
    float canopyShadow = canopyLeaves * canopyFalloff * u_canopy_intensity * u_canopy_enabled;
    wall *= 1.0 - canopyShadow * .18;

    // Secondary reflected light: five quiet, irregular highlights arranged
    // around the window reflection. They drift slowly but remain independent
    // of the main projection and its branch blockers.
    float fleckTime = u_time * .18 * u_reflected_flecks_movement;
    vec2 fleckDrift = vec2(sin(fleckTime), cos(fleckTime * .83 + .8)) * .025 * u_reflected_flecks_movement;
    vec2 reflectionOrigin = vec2(1.02, .66);
    // Upper-left: tall vertical glint. Centre-left and lower-middle: horizontal glints.
    vec2 fleckA = mix(reflectionOrigin, vec2(.43, .74), u_reflected_flecks_spread) + fleckDrift;
    vec2 fleckB = mix(reflectionOrigin, vec2(.42, .50), u_reflected_flecks_spread) - fleckDrift * .72;
    vec2 fleckC = mix(reflectionOrigin, vec2(.68, .28), u_reflected_flecks_spread) + fleckDrift * vec2(.45, -.6);
    vec2 fleckD = mix(reflectionOrigin, vec2(.65, .76), u_reflected_flecks_spread) - fleckDrift * vec2(.48, .35);
    vec2 fleckE = mix(reflectionOrigin, vec2(.51, .34), u_reflected_flecks_spread) + fleckDrift * vec2(.7, -.3);
    float reflectedLight =
      reflectedFleck(lightUv, fleckA, vec2(.038, .13) * u_reflected_flecks_size, 1.4, fleckTime) +
      reflectedFleck(lightUv, fleckB, vec2(.12, .036) * u_reflected_flecks_size, 3.8, fleckTime) +
      reflectedFleck(lightUv, fleckC, vec2(.11, .038) * u_reflected_flecks_size, 6.2, fleckTime) +
      reflectedFleck(lightUv, fleckD, vec2(.09, .03) * u_reflected_flecks_size, 8.6, fleckTime) +
      reflectedFleck(lightUv, fleckE, vec2(.075, .026) * u_reflected_flecks_size, 11.4, fleckTime);
    reflectedLight = clamp(reflectedLight, 0.0, 1.0) * u_reflected_flecks_intensity * u_reflected_flecks_enabled;
    vec3 reflectedColour = vec3(1.0, .95, .78);
    vec3 screenedReflection = 1.0 - (1.0 - wall) * (1.0 - reflectedColour);
    wall = mix(wall, screenedReflection, reflectedLight * .42);

    gl_FragColor = vec4(wall, 1.0);
  }
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(message || "Unable to compile the wall shader.");
  }

  return shader;
}

export default function WallBackground({ controls, canopyControls, reflectedFlecksControls }) {
  const canvasRef = useRef(null);
  const controlsRef = useRef(controls);
  const canopyControlsRef = useRef(canopyControls);
  const reflectedFlecksControlsRef = useRef(reflectedFlecksControls);

  useEffect(() => {
    controlsRef.current = controls;
  }, [controls]);

  useEffect(() => {
    canopyControlsRef.current = canopyControls;
  }, [canopyControls]);

  useEffect(() => {
    reflectedFlecksControlsRef.current = reflectedFlecksControls;
  }, [reflectedFlecksControls]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl", { alpha: false, antialias: false });

    if (!gl) return undefined;

    let animationFrame;
    let resizeObserver;
    let program;
    let wallTexture;

    try {
      const vertex = createShader(gl, gl.VERTEX_SHADER, vertexShader);
      const fragment = createShader(gl, gl.FRAGMENT_SHADER, fragmentShader);
      program = gl.createProgram();
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) || "Unable to link the wall shader.");
      }

      const vertices = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertices);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW
      );

      gl.useProgram(program);
      const position = gl.getAttribLocation(program, "a_position");
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

      const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
      const cssResolutionLocation = gl.getUniformLocation(program, "u_css_resolution");
      const timeLocation = gl.getUniformLocation(program, "u_time");
      const wallTextureLocation = gl.getUniformLocation(program, "u_wall_texture");
      const exposureLocation = gl.getUniformLocation(program, "u_exposure");
      const textureAmountLocation = gl.getUniformLocation(program, "u_texture_amount");
      const poresAmountLocation = gl.getUniformLocation(program, "u_pores_amount");
      const roomVariationLocation = gl.getUniformLocation(program, "u_room_variation");
      const cornerShadowLocation = gl.getUniformLocation(program, "u_corner_shadow");
      const wallWarmthLocation = gl.getUniformLocation(program, "u_wall_warmth");
      const canopyEnabledLocation = gl.getUniformLocation(program, "u_canopy_enabled");
      const canopyIntensityLocation = gl.getUniformLocation(program, "u_canopy_intensity");
      const canopyMovementLocation = gl.getUniformLocation(program, "u_canopy_movement");
      const canopyScaleLocation = gl.getUniformLocation(program, "u_canopy_scale");
      const canopyHorizontalSpreadLocation = gl.getUniformLocation(program, "u_canopy_horizontal_spread");
      const canopyVerticalReachLocation = gl.getUniformLocation(program, "u_canopy_vertical_reach");
      const canopySoftnessLocation = gl.getUniformLocation(program, "u_canopy_softness");
      const reflectedFlecksEnabledLocation = gl.getUniformLocation(program, "u_reflected_flecks_enabled");
      const reflectedFlecksIntensityLocation = gl.getUniformLocation(program, "u_reflected_flecks_intensity");
      const reflectedFlecksMovementLocation = gl.getUniformLocation(program, "u_reflected_flecks_movement");
      const reflectedFlecksSizeLocation = gl.getUniformLocation(program, "u_reflected_flecks_size");
      const reflectedFlecksSpreadLocation = gl.getUniformLocation(program, "u_reflected_flecks_spread");

      wallTexture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, wallTexture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        new Uint8Array([156, 145, 126, 255])
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.uniform1i(wallTextureLocation, 0);

      const wallTextureImage = new Image();
      wallTextureImage.onload = () => {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, wallTexture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, wallTextureImage);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      };
      wallTextureImage.src = "/playground/evening-window/texture.jpg";
      const resize = () => {
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
        const bounds = canvas.getBoundingClientRect();
        const width = Math.round(bounds.width * pixelRatio);
        const height = Math.round(bounds.height * pixelRatio);

        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
          gl.viewport(0, 0, width, height);
        }
      };

      resize();
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(canvas);

      const start = performance.now();
      const render = (now) => {
        resize();
        gl.useProgram(program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, wallTexture);
        gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
        const bounds = canvas.getBoundingClientRect();
        gl.uniform2f(cssResolutionLocation, bounds.width, bounds.height);
        const current = controlsRef.current;
        gl.uniform1f(exposureLocation, current.exposure);
        gl.uniform1f(textureAmountLocation, current.texture);
        gl.uniform1f(poresAmountLocation, current.pores);
        gl.uniform1f(roomVariationLocation, current.roomVariation);
        gl.uniform1f(cornerShadowLocation, current.cornerShadow);
        gl.uniform1f(wallWarmthLocation, current.wallWarmth);
        const canopy = canopyControlsRef.current;
        gl.uniform1f(canopyEnabledLocation, canopy.enabled ? 1 : 0);
        gl.uniform1f(canopyIntensityLocation, canopy.intensity);
        gl.uniform1f(canopyMovementLocation, canopy.movement);
        gl.uniform1f(canopyScaleLocation, canopy.scale);
        gl.uniform1f(canopyHorizontalSpreadLocation, canopy.horizontalSpread);
        gl.uniform1f(canopyVerticalReachLocation, canopy.verticalReach);
        gl.uniform1f(canopySoftnessLocation, canopy.softness);
        const reflectedFlecks = reflectedFlecksControlsRef.current;
        gl.uniform1f(reflectedFlecksEnabledLocation, reflectedFlecks.enabled ? 1 : 0);
        gl.uniform1f(reflectedFlecksIntensityLocation, reflectedFlecks.intensity);
        gl.uniform1f(reflectedFlecksMovementLocation, reflectedFlecks.movement);
        gl.uniform1f(reflectedFlecksSizeLocation, reflectedFlecks.size);
        gl.uniform1f(reflectedFlecksSpreadLocation, reflectedFlecks.spread);
        gl.uniform1f(timeLocation, (now - start) / 1000);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        animationFrame = requestAnimationFrame(render);
      };

      animationFrame = requestAnimationFrame(render);
    } catch (error) {
      console.error("Unable to initialise the feelings wall shader.", error);
    }

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      if (program) gl.deleteProgram(program);
      if (wallTexture) gl.deleteTexture(wallTexture);
      releaseContext(gl);
    };
  }, []);

  return <canvas className={styles.wallCanvas} ref={canvasRef} aria-hidden="true" />;
}
