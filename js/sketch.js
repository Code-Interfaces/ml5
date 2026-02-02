let video;
let handPose;
let hands = [];
let fingerTrailLeft, fingerTrailRight;

let easterEggImg;
let easterEggThreshold = 100;

function preload() {
  // Load the easter egg image (update the path accordingly)
  easterEggImg = loadImage("assets/easterEgg.png");

  // Initialize handPose with the video flipped.
  handPose = ml5.handPose({ flipped: true });
}

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
  fingerTrailLeft = new FingerTrail(100, color(0, 255, 0), 100, 3000); // idle after 3 seconds
  fingerTrailRight = new FingerTrail(100, color(0, 0, 255), 100, 3000);
}

function gotHands(results) {
  hands = results;
}

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
