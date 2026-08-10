# Fix API Error and Optimize LiFi Terminal

This plan addresses the critical API level error in `MainActivity.java` where `CameraManager.setTorchMode` requires API level 23 (Android 6.0), while the current `minSdk` is 21. It also includes several code optimizations and cleanups to ensure a "proper" and robust APK.

## User Review Required

> [!IMPORTANT]
> The `minSdkVersion` will be increased from 21 to 23. This means the app will only run on Android 6.0 (Marshmallow) and above. Given that the core functionality (direct torch control via `setTorchMode`) requires API 23, this is the cleanest solution for a "proper" APK.

## Proposed Changes

### Build Configuration

#### [MODIFY] [app/build.gradle](file:///C:/Users/Niktrix/vidya/vidya/projects/lifi-secure-terminal/android_apk/app/build.gradle)
- Increase `minSdk` to 23.

---

### App Implementation

#### [MODIFY] [MainActivity.java](file:///C:/Users/Niktrix/vidya/vidya/projects/lifi-secure-terminal/android_apk/app/src/main/java/com/lifisecure/terminal/MainActivity.java)
- Remove unused `lcdLine1` field and initialization.
- Fix redundant casting of `char` to `int`.
- Fix string concatenation in a loop within `updateSimulatedLCD` by using a more efficient approach.
- Use `String.format` with `Locale.US` for baud rate display.
- Clean up other minor warnings identified during analysis.

## Verification Plan

### Automated Tests
- Run `app:assembleDebug` to verify the build completes without errors.
- Run `analyze_file` again to ensure all critical lint errors and warnings are resolved.

### Manual Verification
- Deploy to an Android device (API 23+) and verify flashlight pulsing functionality.
- Verify the LCD simulator updates correctly during transmission.
- Verify the UI responsiveness during high-speed pulse transmission.
