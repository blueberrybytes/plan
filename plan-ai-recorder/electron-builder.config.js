/**
 * Dynamic electron-builder configuration file.
 * We resolve BRAND_KEY from the environment to dynamically switch Build IDs, Icons, and Protocols.
 */

// Bypass electron-builder's Mac App Store installer detection bug by explicitly providing the SHA-1 hash
process.env.CSC_INSTALLER_NAME = "E2924F8F6A8AE10A6C53556380E189C362799B84";

const brandKey = process.env.BRAND_KEY || "blueberrybytes";
const isHouseGroup = brandKey === "housegroup";

console.log(`[electron-builder] Building for BRAND_KEY: ${brandKey}`);

const appId = isHouseGroup
  ? "media.housegroup.plan-ai-recorder"
  : "com.blueberrybytes.plan-ai-recorder";

const productName = isHouseGroup ? "House Group Plan AI" : "Plan AI Recorder";
const protocolScheme = isHouseGroup
  ? "housegroup-recorder"
  : "blueberrybytes-recorder";

const iconPath = `resources/${brandKey}`; // We expect icon.icns, icon.ico, icon.png in these subfolders

module.exports = {
  appId: appId,
  productName: productName,
  publish: [
    {
      provider: "github",
      owner: "blueberrybytes",
      repo: "plan-ai-recorder-releases",
      releaseType: "draft",
      channel: isHouseGroup ? "housegroup" : "latest",
    },
  ],
  buildVersion: "172",
  protocols: [
    {
      name: productName,
      schemes: [protocolScheme],
    },
  ],
  afterSign: "scripts/notarize.js",
  directories: {
    output: "release",
  },
  files: [
    "dist-electron/**/*",
    "!**/node_modules/@sentry/cli*/**",
    "!**/node_modules/@sentry/cli/**/*",
  ],
  mac: {
    notarize: false,
    icon: `${iconPath}/icon.icns`,
    category: "public.app-category.productivity",
    minimumSystemVersion: "12.0.0",
    target: ["dmg", "zip", "mas"],
    binaries: ["macos/AudioCapture", "macos/MicActivity"],
    extraFiles: [
      {
        from: "macos/AudioCapture",
        to: "Resources/bin/AudioCapture",
      },
      {
        from: "macos/MicActivity",
        to: "Resources/bin/MicActivity",
      },
    ],
    hardenedRuntime: true,
    entitlements: "macos/entitlements.plist",
    entitlementsInherit: "macos/entitlements.plist",
    extendInfo: {
      NSMicrophoneUsageDescription: `${productName} securely captures your microphone input and transmits it to our AI servers to transcribe your voice during meetings.`,
      NSScreenCaptureUsageDescription: `${productName} securely captures your system audio output and transmits it to our AI servers to transcribe video meetings. No visual UI screen content is recorded.`,
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  win: {
    icon: `${iconPath}/icon.ico`,
    target: [
      {
        target: "nsis",
        arch: ["x64"],
      },
    ],
  },
  mas: {
    entitlements: "macos/entitlements.mas.plist",
    entitlementsInherit: "macos/entitlements.mas.inherit.plist",
    provisioningProfile: "build/mas.provisionprofile",
    identity: "BLUEBERRYBYTES SERVICES FZCO (8NN84K7QKJ)",
    hardenedRuntime: false,
    binaries: ["macos/AudioCapture", "macos/MicActivity"],
  },
  linux: {
    icon: `${iconPath}/icon.png`,
    target: ["AppImage", "deb"],
    category: "Office",
  },
};
