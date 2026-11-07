# Building and Running the Capacitor Android App

The web app can be packaged as an installable Android APK using
[Capacitor](https://capacitorjs.com/). The native Android project and helper scripts are
in `android/`.

* [Prerequisites](#prerequisites)
* [Prepare and synchronize the app](#prepare-and-synchronize-the-app)
* [Build and open in Android Studio](#build-and-open-in-android-studio)
* [Native inference](#native-inference)

## Prerequisites

Initialize the web app as described in [Building and Running the Web App](web-app.md).
Install the Android-side dependencies from the repository root:

```sh
npm --prefix android ci
```

The Android SDK and Android Studio are also required to build and install the app.

## Prepare and synchronize the app

Download any model selected for Android before synchronizing:

```sh
npm --prefix app run init:download
npm --prefix android run android:sync
```

The sync script builds the web app, prepares the Android staging directory, and runs
`npx cap sync android`. Run it again whenever web sources or files in `app/static/`
change.

To keep the APK within ZIP32 size limits, the script stages the web assets in
`.capacitor/www/`. The directory is configured as `webDir` in
[`android/capacitor.config.ts`](../android/capacitor.config.ts). It contains all web
assets and only the pre-downloaded models marked
`"engines": {"onnx-android": {"include": true}}` in
[`app/static/models/index.json`](../app/static/models/index.json). The staging directory
is recreated during every sync to avoid retaining outdated models.

Missing models can be downloaded by the Android app from the HuggingFace Hub. Disable
the corresponding features in [`app/static/config.json`](../app/static/config.json)
if those downloads should not be available.

## Build and open in Android Studio

Open `android/app/` in Android Studio, then select **Build → Generate App Bundles or
APKs**. The project can also be opened from the command line:

```sh
npm --prefix android run android:open
```

## Native inference

For native inference, the Android app uses ONNX Runtime directly to reproduce the
behavior of the relevant transformers.js pipelines. This is a separate implementation;
there is currently no HuggingFace Transformers port for Android.
