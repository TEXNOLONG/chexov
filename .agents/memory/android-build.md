---
name: Android APK Build Notes
description: How to build the APK, known issues and fixes
---

# Build command
cd android && export ANDROID_HOME=/home/runner/android-sdk && export JAVA_HOME=$(dirname $(dirname $(readlink -f $(which java)))) && ./gradlew assembleDebug --no-daemon

# Requirements
- Java 21 required (NOT 17 — capacitor-android uses source release 21)
- Install via Nix: jdk21 package
- Android SDK at /home/runner/android-sdk (build-tools;33.0.0, platforms;android-33)

# Known fix: Kotlin stdlib duplicate classes
In android/build.gradle, add resolutionStrategy inside allprojects:
```
configurations.all {
  resolutionStrategy.eachDependency { DependencyResolveDetails details ->
    if (details.requested.group == 'org.jetbrains.kotlin') {
      details.useVersion '1.8.22'
    }
  }
}
```

# Output
android/app/build/outputs/apk/debug/app-debug.apk (~4MB)
