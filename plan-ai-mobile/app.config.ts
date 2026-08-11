import { ExpoConfig, ConfigContext } from "expo/config";
import * as fs from "fs";
import * as path from "path";

export default ({ config }: ConfigContext): ExpoConfig => {
  // --- EAS LOCAL BUILD WORKAROUND ---
  // If the build is happening in a /tmp directory and the files were stripped,
  // copy them directly from the original workspace.
  const originalIosPath = "/Users/xavier/repositories/blueberrybytes/plan/plan-ai-mobile/GoogleService-Info.plist";
  const originalAndroidPath = "/Users/xavier/repositories/blueberrybytes/plan/plan-ai-mobile/google-services.json";
  
  if (!fs.existsSync(path.join(__dirname, "GoogleService-Info.plist")) && fs.existsSync(originalIosPath)) {
    fs.copyFileSync(originalIosPath, path.join(__dirname, "GoogleService-Info.plist"));
  }
  if (!fs.existsSync(path.join(__dirname, "google-services.json")) && fs.existsSync(originalAndroidPath)) {
    fs.copyFileSync(originalAndroidPath, path.join(__dirname, "google-services.json"));
  }
  // ----------------------------------

  const isProduction = process.env.APP_ENV === "production";
  const appVersion = "4.3.4";
  const bundleIdentifier = "com.blueberrybytes.planai";

  return {
    ...config,
    name: isProduction ? "Plan AI" : "Plan AI (Dev)",
    slug: "plan-ai-mobile",
    version: appVersion,
    orientation: "portrait",
    icon: "./assets/images/bbb.png",
    scheme: "planaimobile",
    userInterfaceStyle: "automatic",
    ios: {
      bundleIdentifier: bundleIdentifier,
      googleServicesFile: "./GoogleService-Info.plist",
      entitlements: {
        "com.apple.developer.applesignin": ["Default"],
      },
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        UIBackgroundModes: ["audio"],
        NSMicrophoneUsageDescription:
          "Plan AI requires microphone access to record your meetings and securely transcribe them into text using cloud AI. Audio is never stored permanently.",
        NSLocationWhenInUseUsageDescription:
          "Plan AI uses your location to tag where meetings were recorded, making it easier to search and organize your transcripts.",
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "Plan AI uses your location to tag where meetings were recorded, making it easier to search and organize your transcripts.",
        NSLocationAlwaysUsageDescription:
          "Plan AI uses your location to tag where meetings were recorded, making it easier to search and organize your transcripts.",
      },
    },
    android: {
      permissions: [
        "android.permission.RECORD_AUDIO",
        "android.permission.FOREGROUND_SERVICE",
        "android.permission.FOREGROUND_SERVICE_MICROPHONE",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
      ],
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/bbb_android_icon.png",
      },
      predictiveBackGestureEnabled: false,
      package: bundleIdentifier,
      googleServicesFile: "./google-services.json",
    },
    web: {
      output: "static",
      favicon: "./assets/images/bbb.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#000000",
          android: {
            image: "./assets/images/bbb.png",
            imageWidth: 76,
          },
        },
      ],
      [
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static",
          },
          android: {
            usesCleartextTraffic: true,
          },
        },
      ],
      "@react-native-firebase/app",
      "@react-native-firebase/auth",
      "@react-native-firebase/crashlytics",
      "@react-native-google-signin/google-signin",
      "expo-audio",
      [
        "@sentry/react-native/expo",
        {
          url: "https://sentry.io/",
          project: "plan-ai-mobile",
          organization: "blueberrybytes-services-fzco",
        },
      ],
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "Plan AI uses your location to tag where meetings were recorded, making it easier to search and organize your transcripts.",
          locationAlwaysAndWhenInUsePermission:
            "Plan AI uses your location to tag where meetings were recorded, making it easier to search and organize your transcripts.",
          locationAlwaysPermission:
            "Plan AI uses your location to tag where meetings were recorded, making it easier to search and organize your transcripts.",
        },
      ],
      "./plugins/with-rnfb-fix.js",
      "./plugins/with-adi-registration.js",
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      eas: {
        projectId: "1e48d947-aacd-4008-9f3e-80b260fd06b5",
      },
    },
  };
};
