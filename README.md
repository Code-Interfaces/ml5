# Hand Tracking with ml5.js & p5.js

1. [Project Setup](#project-setup)
2. [Step 1: Create the HTML File](#step-1-create-the-html-file)
3. [Step 2: Add Basic Styling](#step-2-add-basic-styling)
4. [Step 3: Create the Main Sketch](#step-3-create-the-main-sketch)
5. [Step 4: Create the FingerTrail Class](#step-4-create-the-fingertrail-class)
6. [Step 5: Add an Easter Egg](#step-5-add-an-easter-egg)
7. [Challenges & Extensions](#challenges--extensions)

---

## Project Setup

### Folder Structure

Create the following folder structure:

```
ml5-handpose/
├── index.html
├── style.css
├── jsconfig.json
├── assets/
│   └── easterEgg.png    (your secret image!)
├── js/
│   ├── sketch.js
│   └── fingerTrail.js
└── libraries/
    ├── p5.min.js
    ├── p5.sound.min.js
    └── ml5.min.js
```

### Download Libraries

Download the required libraries:

- **p5.js**: [https://p5js.org/download/](https://p5js.org/download/)
- **ml5.js**: [https://ml5js.org/](https://ml5js.org/)

Place the `.min.js` files in the `libraries/` folder.

---

## Step 1: Create the HTML File

Create `index.html` with the following code:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <title>Sketch</title>

    <link rel="stylesheet" type="text/css" href="style.css" />

    <script src="libraries/p5.min.js"></script>
    <script src="libraries/p5.sound.min.js"></script>
    <script src="libraries/ml5.min.js"></script>
  </head>

  <body>
    <script src="js/fingerTrail.js"></script>
    <script src="js/sketch.js"></script>
  </body>
</html>
```

> **Note:** The order of script tags matters! Load `fingerTrail.js` before `sketch.js` so the class is available.

---

## Step 2: Add Basic Styling

Create `style.css`:

```css
html,
body {
  margin: 0;
  padding: 0;
}

canvas {
  display: block;
}
```

This removes default margins and ensures the canvas fills the browser window.

---

## Step 3: Create the Main Sketch

Create `js/sketch.js` and build it step by step:

### Step 3.1: Declare Variables

```javascript
let video;
let handPose;
let hands = [];
let fingerTrailLeft, fingerTrailRight;

let easterEggImg;
let easterEggThreshold = 100;
```

| Variable                | Purpose                            |
| ----------------------- | ---------------------------------- |
| `video`                 | Stores the webcam capture          |
| `handPose`              | The ml5.js hand detection model    |
| `hands`                 | Array of detected hand data        |
| `fingerTrailLeft/Right` | Trail objects for each hand        |
| `easterEggImg`          | Hidden image for the easter egg    |
| `easterEggThreshold`    | Distance to trigger the easter egg |

---

### Step 3.2: Preload Assets

```javascript
function preload() {
  // Load the easter egg image (update the path accordingly)
  easterEggImg = loadImage("assets/easterEgg.png");

  // Initialize handPose with the video flipped.
  handPose = ml5.handPose({ flipped: true });
}
```

> **Why flipped?** When looking at yourself in a webcam, it feels more natural if the video is mirrored (like a mirror).

---

### Step 3.3: Setup Function

```javascript
function setup() {
  createCanvas(windowWidth, windowHeight);

  // Setup video capture with flipped orientation.
  video = createCapture(VIDEO, { flipped: true });
  video.size(width, height);
  video.hide();

  // Start hand detection.
  handPose.detectStart(video, gotHands);

  // Create FingerTrail instances for each hand.
  // Parameters: maxLength, color, debounceDelay (ms), idleThreshold (ms)
  fingerTrailLeft = new FingerTrail(100, color(0, 255, 0), 100, 3000); // Green - idle after 3 seconds
  fingerTrailRight = new FingerTrail(100, color(0, 0, 255), 100, 3000); // Blue - idle after 3 seconds
}
```

**Key concepts:**

- `createCapture(VIDEO)` — Accesses the webcam
- `video.hide()` — Hides the default video element (we'll draw our own visuals)
- `handPose.detectStart()` — Begins continuous hand detection

---

### Step 3.4: Handle Hand Detection Results

```javascript
function gotHands(results) {
  hands = results;
}
```

This callback is triggered every time ml5.js detects hands. The `results` array contains data about all detected hands.

---

### Step 3.5: The Draw Loop

```javascript
function draw() {
  background("#fefefe");

  // Process each detected hand.
  if (hands.length > 0) {
    for (let hand of hands) {
      if (hand.confidence > 0.1) {
        // The index finger tip is typically keypoint 8.
        let indexTip = hand.keypoints[8];
        let rawPt = createVector(indexTip.x, indexTip.y);

        // Update the appropriate finger trail based on handedness.
        if (hand.handedness === "Left") {
          fingerTrailLeft.update(rawPt);
        } else {
          fingerTrailRight.update(rawPt);
        }
      }
    }
  }

  // Draw both finger trails.
  fingerTrailLeft.draw();
  fingerTrailRight.draw();

  // --- Easter Egg Check ---
  // If both trails have a current (smoothed) point, calculate the distance.
  if (fingerTrailLeft.current && fingerTrailRight.current) {
    let d = dist(
      fingerTrailLeft.current.x,
      fingerTrailLeft.current.y,
      fingerTrailRight.current.x,
      fingerTrailRight.current.y,
    );

    // If the fingertips are close enough, display the image in the center.
    if (d < easterEggThreshold) {
      // Calculate image position so that it is centered.
      let imgX = width / 2 - easterEggImg.width / 2;
      let imgY = height / 2 - easterEggImg.height / 2;
      image(easterEggImg, imgX, imgY);
    }
  }
}
```

### Hand Keypoint Reference

ml5.js handPose provides 21 keypoints per hand:

| Index | Keypoint          |
| ----- | ----------------- |
| 0     | Wrist             |
| 4     | Thumb tip         |
| 8     | Index finger tip  |
| 12    | Middle finger tip |
| 16    | Ring finger tip   |
| 20    | Pinky tip         |

---

## Step 4: Create the FingerTrail Class

Create `js/fingerTrail.js`:

```javascript
class FingerTrail {
  /**
   * @param {number} maxLength - Maximum number of points in the trail.
   * @param {color} col - Color of the trail.
   * @param {number} debounceDelay - Minimum delay (in ms) between recorded points.
   * @param {number} idleThreshold - Time (in ms) after which the trail begins to clear if idle.
   */
  constructor(maxLength, col, debounceDelay, idleThreshold) {
    this.maxLength = maxLength; // Maximum number of points in the trail.
    this.col = col; // Color of the trail.
    this.points = []; // Array to hold the trail's points.
    this.current = null; // Current smoothed position.
    this.smoothingFactor = 0.3; // Smoothing factor for lerping (adjust between 0 and 1).
    this.debounceDelay = debounceDelay; // Debounce delay in milliseconds.
    this.lastRecordedTime = 0; // Timestamp of the last point recording.
    this.idleThreshold = idleThreshold; // Time (ms) after which the trail auto-clears.
  }

  // Update the trail with a new detected point.
  update(newPoint) {
    // If we don't have a current smoothed point yet, initialize it.
    if (!this.current) {
      this.current = newPoint.copy();
    } else {
      // Smoothly interpolate (lerp) the current point toward the new point.
      this.current.x = lerp(this.current.x, newPoint.x, this.smoothingFactor);
      this.current.y = lerp(this.current.y, newPoint.y, this.smoothingFactor);
    }

    // Record a new point only if the debounce interval has passed.
    if (millis() - this.lastRecordedTime >= this.debounceDelay) {
      this.points.push(this.current.copy());
      this.lastRecordedTime = millis();

      // Ensure the trail does not exceed the maximum length.
      if (this.points.length > this.maxLength) {
        this.points.shift();
      }
    }
  }

  // Draw the trail as a series of connected Bézier curves.
  draw() {
    // If the trail has been idle too long, gradually clear the trail.
    if (
      millis() - this.lastRecordedTime > this.idleThreshold &&
      this.points.length > 0
    ) {
      // Remove one point every 5 frames.
      if (frameCount % 5 === 0) {
        this.points.shift();
      }
    }

    // Only draw if we have at least two points.
    if (this.points.length < 2) return;

    stroke(this.col);
    strokeWeight(4);
    noFill();

    // If there are only two points, simply draw a line.
    if (this.points.length === 2) {
      line(
        this.points[0].x,
        this.points[0].y,
        this.points[1].x,
        this.points[1].y,
      );
      return;
    }

    // Draw a series of connected Bézier curves using Catmull-Rom to Bézier conversion.
    for (let i = 0; i < this.points.length - 1; i++) {
      let p1 = this.points[i];
      let p2 = this.points[i + 1];

      // Define neighboring points for control point calculation.
      let p0 = i === 0 ? p1 : this.points[i - 1];
      let p3 = i + 2 < this.points.length ? this.points[i + 2] : p2;

      // Calculate control points.
      let cp1 = p5.Vector.add(p1, p5.Vector.mult(p5.Vector.sub(p2, p0), 1 / 6));
      let cp2 = p5.Vector.sub(p2, p5.Vector.mult(p5.Vector.sub(p3, p1), 1 / 6));

      // Draw the Bézier segment.
      bezier(p1.x, p1.y, cp1.x, cp1.y, cp2.x, cp2.y, p2.x, p2.y);
    }
  }
}
```

### Key Concepts in FingerTrail

#### 1. Smoothing with `lerp()`

```javascript
this.current.x = lerp(this.current.x, newPoint.x, this.smoothingFactor);
```

`lerp(a, b, t)` returns a value between `a` and `b` based on `t`:

- `t = 0` → returns `a`
- `t = 1` → returns `b`
- `t = 0.3` → returns a value 30% of the way from `a` to `b`

This creates **smooth motion** by gradually moving toward the target.

#### 2. Debouncing

Debouncing prevents recording too many points too quickly:

```javascript
if (millis() - this.lastRecordedTime >= this.debounceDelay) {
  this.points.push(this.current.copy());
  this.lastRecordedTime = millis();
}
```

#### 3. Bézier Curves

Instead of connecting points with straight lines, we use **Bézier curves** for smooth, organic-looking trails.

---

## Step 5: Add an Easter Egg

1. Create an `assets/` folder
2. Add an image named `easterEgg.png`
3. The image appears when both index fingers are brought close together!

Try changing `easterEggThreshold` to adjust sensitivity:

- Smaller value = fingers must be closer
- Larger value = triggers more easily

---

## Challenges & Extensions

Try these modifications to practice:

1. Change the trail colors
2. Adjust the `smoothingFactor` (try 0.1 vs 0.9)
3. Change the trail's `strokeWeight`
4. Track a different finger (change keypoint `8` to `4` for thumb)
5. Add more trails for multiple fingers
6. Make the trail color change based on speed
7. Add particle effects when fingers meet
8. Create a drawing app that saves the trails
9. Use hand gestures to trigger different effects

---

## Running the Project

### Option 1: VS Code Live Server

1. Install the "Live Server" extension in VS Code
2. Right-click `index.html` → "Open with Live Server"

### Option 2: Python HTTP Server

```bash
cd ml5-handpose
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

### Option 3: Node.js

```bash
npx serve
```

> **Important:** You must run this on a local server. Opening `index.html` directly will cause CORS errors with the webcam.

---

## Troubleshooting

| Problem                  | Solution                                        |
| ------------------------ | ----------------------------------------------- |
| Camera not working       | Check browser permissions for camera access     |
| "ml5 is not defined"     | Make sure libraries are loaded in correct order |
| Trails are jittery       | Decrease `smoothingFactor` (e.g., 0.1)          |
| Easter egg not appearing | Check that `easterEgg.png` exists in `assets/`  |

---

## Resources

- [p5.js Reference](https://p5js.org/reference/)
- [ml5.js Documentation](https://docs.ml5js.org/)
- [ml5 HandPose](https://docs.ml5js.org/#/reference/handpose)
- [Bézier Curves Explained](https://pomax.github.io/bezierinfo/)

---
