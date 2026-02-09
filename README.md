# Hand Gesture Volume Control

A web-based volume control interface that uses hand gestures detected via webcam to adjust audio volume in real-time.

## Features

- **Gesture Control**: Open your hand to activate volume control, make a fist to pause
- **Wrist Rotation**: Rotate your wrist to adjust volume smoothly
- **Visual Feedback**: Dynamic color-changing glow (White → Green → Yellow → Red) based on volume level
- **Digital Display**: Embedded volume percentage display inside the knob
- **Smooth Interaction**: Linear interpolation (Lerp) for flicker-free volume adjustments
- **Audio Demo**: Built-in play/stop button to test volume control

## Technologies Used

- **MediaPipe Hands**: Real-time hand tracking and landmark detection
- **HTML5 Audio API**: Volume control
- **Vanilla JavaScript**: Gesture recognition logic
- **CSS**: Modern neumorphic design with glassmorphic elements

## How to Use

1. Open `index.html` in a modern web browser (Chrome, Edge, or Firefox recommended)
2. Allow camera access when prompted
3. **Open your hand** in front of the camera to activate volume control
4. **Rotate your wrist** to adjust the volume
5. **Make a fist** to pause/deactivate control
6. Click the play button to start demo audio and test the volume

## Installation

No installation required! Simply:

```bash
# Clone the repository
git clone https://github.com/kiolkissy/hand-gesture-volume-control.git

# Open index.html in your browser
```

Or use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js (http-server)
npx http-server
```

## Browser Compatibility

- Chrome/Edge: ✅ Fully supported
- Firefox: ✅ Supported
- Safari: ⚠️ May require additional permissions

## License

MIT License - feel free to use and modify!

## Author

Created by [kiolkissy](https://github.com/kiolkissy)
