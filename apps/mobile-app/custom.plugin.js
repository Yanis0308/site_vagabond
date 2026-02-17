const { withGradleProperties } = require("expo/config-plugins");

// Custom plugin to fix memory issue on Android build
// See: https://github.com/expo/expo/issues/30413
function setGradlePropertiesValue(config, key, value) {
  return withGradleProperties(config, (exportedConfig) => {
    const keyIdx = exportedConfig.modResults.findIndex(
      (item) => item.type === "property" && item.key === key,
    );
    if (keyIdx >= 0) {
      exportedConfig.modResults.splice(keyIdx, 1, {
        type: "property",
        key,
        value,
      });
    } else {
      exportedConfig.modResults.push({
        type: "property",
        key,
        value,
      });
    }

    return exportedConfig;
  });
}

module.exports = function withCustomPlugin(config) {
  config = setGradlePropertiesValue(
    config,
    "org.gradle.jvmargs",
    "-Xmx8192m -XX:MaxMetaspaceSize=2048m",
    "g.gradle.configureondemand=true",
    "org.gradle.daemon=false",
  );

  return config;
};
