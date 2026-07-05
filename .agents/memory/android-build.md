---
name: Android APK Build Notes
description: How to build the APK, known issues and fixes
---

# Build command
```
export ANDROID_HOME=/home/runner/android-sdk
export JAVA_HOME=$(dirname $(dirname $(readlink -f $(which java))))
export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH
cd android && ./gradlew assembleDebug --no-daemon
```

# Requirements
- Java 21 required (NOT 17 — capacitor-android uses source release 21)
- Android SDK at /home/runner/android-sdk (build-tools;35.0.0, platforms;android-35)

# CRITICAL: SDK is ephemeral
The Android SDK at /home/runner/android-sdk does NOT persist between Replit restarts.
Must reinstall every session:
```bash
mkdir -p /home/runner/android-sdk/cmdline-tools
curl -sL "https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip" -o /tmp/cmdline-tools.zip
unzip -q /tmp/cmdline-tools.zip -d /tmp/cmdtools-extract
mv /tmp/cmdtools-extract/cmdline-tools /home/runner/android-sdk/cmdline-tools/latest
export ANDROID_HOME=/home/runner/android-sdk
export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$PATH
yes | sdkmanager --licenses
sdkmanager "platform-tools" "build-tools;35.0.0" "platforms;android-35"
```

# local.properties must be written
echo "sdk.dir=/home/runner/android-sdk" > android/local.properties

# Known fix: Kotlin stdlib duplicate classes
In android/build.gradle, add resolutionStrategy inside allprojects (already applied):
```
configurations.all {
  resolutionStrategy.eachDependency { DependencyResolveDetails details ->
    if (details.requested.group == 'org.jetbrains.kotlin') {
      details.useVersion '1.8.22'
    }
  }
}
```

# Full build sequence
1. npm run build
2. npx cap sync android
3. echo "sdk.dir=/home/runner/android-sdk" > android/local.properties
4. cd android && ./gradlew assembleDebug --no-daemon

# Output
android/app/build/outputs/apk/debug/app-debug.apk (~11MB with menu images)
