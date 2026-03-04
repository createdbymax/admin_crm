const { notarize } = require("@electron/notarize");

exports.default = async function notarizeApp(context) {
  const { electronPlatformName, appOutDir } = context;

  if (electronPlatformName !== "darwin") {
    return;
  }

  const appleId = process.env.APPLE_ID;
  const appleIdPassword = process.env.APPLE_APP_SPECIFIC_PASSWORD;
  const teamId = process.env.APPLE_TEAM_ID;

  if (!appleId || !appleIdPassword || !teamId) {
    console.warn("Skipping notarization: missing APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, or APPLE_TEAM_ID.");
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  await notarize({
    appBundleId: "io.losthills.crm",
    appPath: `${appOutDir}/${appName}.app`,
    appleId,
    appleIdPassword,
    teamId
  });
};
