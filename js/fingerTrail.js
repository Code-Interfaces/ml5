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
        this.points[1].y
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
